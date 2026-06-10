# Frontend Integration Guide — Subscription, Invoice & Enforcement

Reflects exactly what is in the backend today, including current limitations.

## 0. Conventions (read first)

- **Base URL:** `${API_BASE}/api`
- **Auth:** every request needs `Authorization: Bearer <jwt>`. Missing/expired → 401.
- **Response envelope (all endpoints):** `{ status: 'SUCCESS' | 'ERROR', message: string, data?, total? }`. Always read `res.data.data`.
- **Super-admin** = role `super-admin` with no `schoolId`. **Tenant user** = has a `schoolId`.

## 1. Types

```ts
// ---- Package ----
export interface Limits { noOfStudents: number; noOfBranches: number; noOfStaffs: number; noOfSections: number; }

// ---- Subscription ----
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'upgraded' | 'downgraded';
export interface Subscription {
  _id: string;
  schoolId: string;
  packageId: string;
  serialNumber: string;
  packageSnapshot: { name: string; price: number; durationInDays: number; limits: Limits; platforms: {web:boolean;android:boolean;ios:boolean}; features: string[] };
  computedLimits: Limits;
  customLimits?: Partial<Limits>;
  startDate: string;
  endDate: string;
  gracePeriodInDays: number;        // NEW
  status: SubscriptionStatus;
  previousSubscriptionId?: string;
  createdAt: string; updatedAt: string;
}

// ---- Invoice ----
export type InvoiceType = 'new' | 'upgrade' | 'downgrade' | 'renewal';
export type InvoiceStatus = 'unpaid' | 'paid' | 'void';
export interface Invoice {
  _id: string; schoolId: string; subscriptionId: string; serialNumber: string;
  type: InvoiceType;
  lineItems: { label: string; amount: number }[];   // credits are negative
  creditApplied: number;
  amountDue: number;                                  // never < 0
  status: InvoiceStatus;
  paymentInfo?: { method?: string; transactionId?: string };
  createdAt: string; updatedAt: string;
}
export interface InvoiceSummary {
  totalDue: number; totalPaid: number;
  unpaidCount: number; paidCount: number; voidCount: number; invoiceCount: number;
}
```

## 2. Endpoints

### A. School signup (super-admin) — creates school and first subscription

```http
POST /api/schools
{
  "name": "...", "email": "...", "password": "...",
  "packageId": "<pkg id>",        // REQUIRED — drives the subscription
  "gracePeriodInDays": 7,         // optional, integer >= 0, omit -> 0
  "phone": 123, "status": "active", "coa": { }
}
// -> 201 { data: { ...school, packageId, currentSubscriptionId } }
```

Frontend sends `packageId` (+ optional `gracePeriodInDays`). Never send `currentSubscriptionId` — the backend generates it and links both sides (`schoolId` on the subscription, `currentSubscriptionId` on the school).

### B. Subscription management (super-admin)

| Method | Path | Body |
|---|---|---|
| POST | `/api/subscription/assign` | `{ schoolId, packageId, customLimits?, paymentInfo?, gracePeriodInDays? }` |
| POST | `/api/subscription/change` | `{ schoolId, packageId, customLimits?, paymentInfo?, gracePeriodInDays? }` |
| POST | `/api/subscription/renew`  | `{ schoolId, paymentInfo?, gracePeriodInDays? }` |
| POST | `/api/subscription/cancel` | `{ schoolId }` |

- `assign` blank grace → 0. `change`/`renew` blank grace → carries over the current value (pre-fill the input with it).
- `change` auto-detects upgrade vs downgrade from price.

### C. Subscription reads (super-admin: any school; tenant: own only)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/subscription/school/:schoolId/current` | `{ data: Subscription }` or 404 if none |
| GET | `/api/subscription/school/:schoolId` | `{ data: Subscription[], total }` (history, newest-first) |

### D. Invoices

| Method | Path | Returns |
|---|---|---|
| GET | `/api/invoice/school/:schoolId` | `{ data: Invoice[], total }` newest-first |
| GET | `/api/invoice/school/:schoolId/summary` | `{ data: InvoiceSummary }` |
| GET | `/api/invoice/subscription/:subscriptionId` | `{ data: Invoice }` or 404 |
| PATCH | `/api/invoice/:id/pay` (super-admin) | `{ data: Invoice }` |

## 3. The grace-period UI (super-admin forms)

Add a numeric field **"Grace period (days after expiry)"** to the Assign / Change / Renew / School-signup forms.

- Integer ≥ 0. Helper: *"Days the school keeps access after expiry before writes are blocked. 0 = cut off at expiry."*
- Omit the key when blank (don't send 0/null for "leave default"):

```js
const body = { schoolId, packageId };
if (grace !== '' && grace != null) body.gracePeriodInDays = Number(grace);
```

- On change/renew, pre-fill with the school's current `gracePeriodInDays` (from `/current`) so "leave unchanged = keep current".

## 4. Enforcement — what the gate does to the app

The backend blocks **writes** (POST/PUT/PATCH/DELETE) for schools whose subscription is expired/cancelled/none. **Reads always pass.**

### 4a. Handle 402 globally (subscription gate)

```js
api.interceptors.response.use(undefined, (err) => {
  if (err.response?.status === 402) {
    showRenewBanner(err.response.data?.message); // "subscription expired — renew"
  }
  return Promise.reject(err);
});
```

Don't show a generic error toast for 402 — route to billing / show renew CTA.

### 4b. Handle 403 "limit reached" on the 4 create forms

Creating a student / branch / staff / section beyond the plan limit returns 403:

> "Student limit reached for your plan (50). Upgrade your package to add more."

Surface it inline with an "Upgrade" link. (Distinct from permission-403 — key off the message.)

### 4c. Read the subscription-state headers (gated responses)

Every response from a gated route carries:

```
X-Subscription-State: active | grace | expired | cancelled | none
X-Subscription-Block-At: ISO timestamp (writes blocked after this = endDate + grace)
```

```js
const state = res.headers['x-subscription-state'];
const blockAt = res.headers['x-subscription-block-at'];
```

Banner logic:

- `grace` → ⚠️ "Subscription expired — renew before {blockAt} to avoid losing write access." (writes still allowed)
- `expired`/`cancelled`/`none` → 🔒 "Renew to make changes." (writes blocked, reads OK)

> ⚠️ Don't rely solely on the header for the dashboard banner — it's only attached on gated routes (see §6). For a reliable banner, call `/subscription/school/:schoolId/current` on dashboard load and compute the state yourself:

```
now <= endDate                    -> active
endDate < now <= endDate+grace    -> GRACE  (show warning + days left)
now > endDate+grace               -> expired (show renew)
```

## 5. Invoice behavior the UI must handle

- **Void invoices now appear.** On an upgrade/change where the previous invoice was unpaid, that invoice is set to `void` and the new plan is charged full price. If the previous was paid, a prorated credit is applied (negative `lineItems` amount). Render `void` with a distinct badge; hide the pay button on void (`PATCH /pay` returns 400 anyway).
- **Refetch after any subscription mutation.** A plan change voids/creates invoices, so after assign/change/renew invalidate both the invoice list and summary queries (and the subscription query).
- **Summary semantics:** `totalDue` = unpaid only; `totalPaid` = paid only; void excluded from both. Use `totalDue` for "outstanding," don't sum client-side.
- **Don't hardcode amounts** — display `amountDue` / `creditApplied` / `lineItems` from the API.

## 6. ⚠️ Current limitations (plan UX around these)

- **Write-block covers only 4 modules** — student, staff, branch, class/section. Writes in other modules (fee, exam, attendance, timetable, etc.) are not blocked yet and won't 402. So drive banners off the computed state (from `/current`), not "did I get a 402."
- **CORS headers** — if the frontend is on a different origin, `X-Subscription-State` / `X-Subscription-Block-At` may not be readable until the backend adds `exposedHeaders`.
- **No precomputed `/status` endpoint yet** — you compute grace/expiry from `/current` for now.
- **No email/push notifications** — schools are not notified outside the app; the dashboard banner is the only signal. (Cron only audit-logs today.)

## 7. Suggested screens

- **Super-admin → School billing tab:** summary cards (`totalDue`, counts) + invoice table + subscription history + Assign/Change/Renew/Cancel actions (with grace field) + "Mark paid" on unpaid invoices.
- **Tenant dashboard:** call `/current` on load → render grace/expired banner; show plan limits vs usage if you want ("42 / 50 students").
- **Create forms (student/staff/branch/section):** handle the 403 limit message with an upgrade CTA.

---

## Implementation status (frontend)

Tracks what is wired in this repo against the guide above.

- ✅ §2C/§2D reads — `src/services/billing.js` + `src/app/dashboard/system/subscriptions/hooks/useSubscriptions.js`
- ✅ §3 grace field — Assign / Change / Renew (`GracePeriodField.jsx`) and School-signup (`AddOrganizationModal.jsx`)
- ✅ §4a 402 handling — `src/services/apiClient.js` dispatches `subscription:blocked`; `useSubscriptionGuard` refetches on it
- ✅ §4c banner via computed state — `src/utils/subscriptionState.js` + `src/hooks/useSubscriptionGuard.js` + `src/component/SubscriptionGuard.jsx` (mounted in `dashboard/layout.jsx`)
- ✅ §5 invoice/void handling — `InvoiceModal.jsx`, dues card in `subscriptions/page.jsx`
- ⏳ §4b 403 "limit reached" CTA on the 4 create forms — not yet wired
