# SMS Workspace (NodeCampus)

Nx monorepo for the NodeCampus **web + mobile** apps. The backend (`sms-backend`)
stays in its own repo — coupling is only via the backend HTTP API.

## Structure

```
apps/
  admin/      @sms/admin    # School dashboard — admin/sub-admin/staff  → Vercel, port 3000
  student/    @sms/student  # Student dashboard (Next.js)               → Vercel, port 3001
  system/     @sms/system   # Super-admin console — tenants & billing   → Vercel, port 3002
  mobile/     @sms/mobile   # Expo / React Native app                   → EAS Build (Play/App Store)
packages/
  ui/         @sms/ui         # Shared brand tokens & (web) components
  api-client/ @sms/api-client # Shared axios client (backend contract)
  types/      @sms/types      # Shared data models
```

> Web components (`@sms/ui`) cannot be shared with mobile (`<div>` vs `<View>`).
> What web + mobile **do** share: `@sms/api-client`, `@sms/types`, validation, constants.

## Who each web app serves

| App            | Audience                                   | Auth gate |
|----------------|--------------------------------------------|-----------|
| `@sms/admin`   | admin, sub-admin, and every custom staff role (teacher, accountant, …) | dynamic RBAC — `utils/permissions.js` resolves each action to `all` / `branch` / `own` scope |
| `@sms/student` | students                                   | student login |
| `@sms/system`  | super-admin only                           | single role check in `middleware.js` |

**Staff are not a separate app on purpose.** Roles are created at runtime with
arbitrary action sets, so a build-time app boundary cannot serve them — a
teacher's student list is the same screen an admin sees, at `own` scope. The
scope model in `apps/admin/src/utils/permissions.js` is what separates them.

**Super-admin is separate** because tenant/plan/invoice administration is a
different product from running a school: different audience (us, not the
customer), and it shares no screens with `dashboard/school`. A super-admin who
also needs school screens signs into `@sms/admin` as normal — the topbar there
links across to the console via `NEXT_PUBLIC_SYSTEM_URL`.

> Route separation is **not** a security boundary. All three apps read a
> client-written `auth-role` cookie for routing only; the backend must authorize
> every request independently.

## Commands (run from repo root)

```bash
npm install              # install every project (one root node_modules)

# web
npm run dev:admin        # admin   → http://localhost:3000
npm run dev:student      # student → http://localhost:3001
npm run dev:system       # system  → http://localhost:3002
npm run dev              # all three web apps
npm run build            # build all buildable projects (web)

# mobile
npm run mobile           # expo start (Metro)
npm run mobile:android   # expo run:android

# misc
npm run lint
npm run graph            # nx project dependency graph
```

You can also call Nx directly: `npx nx build @sms/admin`, `npx nx start @sms/mobile`, etc.

## Tooling

npm workspaces (package linking) + [Nx](https://nx.dev) (task running, caching, graph),
package-based — each app keeps its own `package.json` scripts, Nx infers them as targets.

## Deployment

| Project        | Target                         |
|----------------|--------------------------------|
| `@sms/admin`   | Vercel project (Root Dir `apps/admin`)   |
| `@sms/student` | Vercel project (Root Dir `apps/student`) |
| `@sms/system`  | Vercel project (Root Dir `apps/system`)  |
| `@sms/mobile`  | Expo EAS Build → Play / App Store        |
| backend        | separate repo / host                     |

## Mobile notes

`apps/mobile/metro.config.js` is configured for the monorepo (watches the root,
resolves hoisted `node_modules`). After `npm install` at the root, run
`npm run mobile` and verify Metro bundles on a device/emulator.
