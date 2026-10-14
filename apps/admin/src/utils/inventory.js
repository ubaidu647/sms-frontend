// Pure helpers for the Inventory screens (stock, purchases, suppliers, assets,
// school shop). No React / browser imports so they can be unit-tested with
// `node --test`. All money math runs in integer paisa (1 Rs = 100 paisa) so
// totals never drift and comparisons are exact.

export const PURCHASE_LINE_KINDS = ['stock', 'asset', 'expense'];
export const ASSET_STATUSES = ['in-use', 'in-store', 'under-repair', 'disposed', 'lost'];
export const ASSET_ACTIVE_STATUSES = ['in-use', 'in-store', 'under-repair'];
export const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor'];
export const ISSUED_TO_TYPES = ['department', 'staff', 'other'];
export const SALE_STATUSES = ['pending', 'billed', 'void'];
export const DOC_STATUSES = ['posted', 'void'];
export const ITEM_UNITS = ['pcs', 'box', 'ream', 'kg', 'set', 'pair', 'pack', 'dozen', 'litre'];
export const MAX_ASSET_QTY_PER_LINE = 500;

export const MOVEMENT_TYPE_LABELS = {
  purchase: 'Purchase',
  'purchase-void': 'Purchase void',
  issue: 'Issue',
  'issue-return': 'Issue void',
  sale: 'Shop sale',
  'sale-void': 'Sale void',
  adjustment: 'Adjustment',
  'transfer-out': 'Transfer out',
  'transfer-in': 'Transfer in',
};

export const ASSET_STATUS_COLORS = {
  'in-use': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'in-store': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'under-repair': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  disposed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  lost: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

export const DOC_STATUS_COLORS = {
  posted: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  billed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  void: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

/* ------------------------------- Money -------------------------------- */

/** Rupee amount (number or string) → integer paisa. Non-numbers → 0. */
export function toPaisa(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(typeof value === 'string' ? value.replace(/,/g, '').trim() : value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + (n >= 0 ? Number.EPSILON : -Number.EPSILON)) * 100);
}

/** Integer paisa → rupees (2-decimal number). */
export function fromPaisa(paisa) {
  return Math.round(Number(paisa) || 0) / 100;
}

/** True when `value` is a number with at most 2 decimals (a valid money input). */
export function isMoneyInput(value) {
  const s = String(value ?? '').trim();
  return /^\d+(\.\d{1,2})?$/.test(s) || /^\.\d{1,2}$/.test(s);
}

/**
 * Quantity → integer hundredths, so fractional units (2.5 kg) compare exactly.
 * Non-numbers → 0.
 */
export function qtyUnits(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + (n >= 0 ? Number.EPSILON : -Number.EPSILON)) * 100);
}

/** quantity × unit price in paisa (quantity may have 2 decimals). */
export function lineAmountPaisa(quantity, unitPrice) {
  return Math.round((qtyUnits(quantity) * toPaisa(unitPrice)) / 100);
}

/* ------------------------------ Purchases ----------------------------- */

/** One purchase line's value in paisa (stock/asset: qty × unit cost; expense: amount). */
export function purchaseLinePaisa(line) {
  if (!line) return 0;
  if (line.kind === 'expense') return toPaisa(line.amount);
  return lineAmountPaisa(line.quantity, line.unitCost);
}

/** Σ line values in paisa. */
export function purchaseTotalPaisa(lines = []) {
  return (lines || []).reduce((sum, l) => sum + purchaseLinePaisa(l), 0);
}

/**
 * Credit remainder (supplier payable created by this purchase) in paisa:
 * total − paid, never below 0.
 */
export function creditRemainderPaisa(totalPaisa, paidPaisa) {
  return Math.max(0, Math.round(totalPaisa) - Math.round(paidPaisa));
}

/** Running figures for the purchase form: paisa + rupee values + paid validation. */
export function purchaseTotals(lines = [], paidAmount = 0) {
  const totalPaisa = purchaseTotalPaisa(lines);
  const paidPaisa = toPaisa(paidAmount);
  const creditPaisa = creditRemainderPaisa(totalPaisa, paidPaisa);
  let paidError = '';
  if (paidPaisa < 0) paidError = 'Paid amount cannot be negative';
  else if (paidPaisa > totalPaisa) paidError = 'Paid amount cannot exceed the purchase total';
  return {
    totalPaisa,
    paidPaisa,
    creditPaisa,
    total: fromPaisa(totalPaisa),
    paid: fromPaisa(paidPaisa),
    credit: fromPaisa(creditPaisa),
    paidError,
  };
}

const isPositiveQty = (v, { integer = false } = {}) => {
  const s = String(v ?? '').trim();
  if (!s) return false;
  const ok = integer ? /^\d+$/.test(s) : /^\d+(\.\d{1,2})?$/.test(s);
  return ok && Number(s) > 0;
};

/**
 * Field errors for one purchase line ({} when valid). Keys match the line's
 * fields so the form can show them inline.
 */
export function validatePurchaseLine(line) {
  const errors = {};
  if (!line || !PURCHASE_LINE_KINDS.includes(line.kind)) {
    errors.kind = 'Pick a line type';
    return errors;
  }
  if (line.kind === 'expense') {
    if (!String(line.description ?? '').trim()) errors.description = 'Description is required';
    if (!isMoneyInput(line.amount) || toPaisa(line.amount) <= 0)
      errors.amount = 'Enter an amount greater than 0';
    return errors;
  }
  if (line.kind === 'stock' && !line.itemId) errors.itemId = 'Pick an item';
  if (line.kind === 'asset') {
    if (!String(line.name ?? '').trim()) errors.name = 'Asset name is required';
    if (!String(line.category ?? '').trim()) errors.category = 'Category is required';
    if (line.condition && !ASSET_CONDITIONS.includes(line.condition))
      errors.condition = 'Pick a valid condition';
  }
  if (line.kind === 'asset') {
    if (!isPositiveQty(line.quantity, { integer: true }))
      errors.quantity = 'Whole number greater than 0';
    else if (Number(line.quantity) > MAX_ASSET_QTY_PER_LINE)
      errors.quantity = `At most ${MAX_ASSET_QTY_PER_LINE} per line`;
  } else if (!isPositiveQty(line.quantity)) {
    errors.quantity = 'Quantity greater than 0 (max 2 decimals)';
  }
  if (!isMoneyInput(line.unitCost) || toPaisa(line.unitCost) <= 0)
    errors.unitCost = 'Enter a unit cost greater than 0';
  return errors;
}

/** Errors for every line (array of objects) + whether any line has an error. */
export function validatePurchaseLines(lines = []) {
  const list = (lines || []).map(validatePurchaseLine);
  return { lines: list, hasErrors: list.some((e) => Object.keys(e).length > 0) };
}

/** A blank line of the given kind for the purchase form. */
export function emptyPurchaseLine(kind = 'stock') {
  if (kind === 'expense') return { kind, description: '', amount: '' };
  if (kind === 'asset')
    return {
      kind,
      name: '',
      category: '',
      quantity: '1',
      unitCost: '',
      location: '',
      condition: 'new',
    };
  return { kind: 'stock', itemId: '', quantity: '', unitCost: '' };
}

const trimOrUndef = (v) => {
  const s = String(v ?? '').trim();
  return s || undefined;
};

/** Form line → API line (numbers parsed, empty optionals dropped). */
export function purchaseLineToPayload(line) {
  if (line.kind === 'expense') {
    return {
      kind: 'expense',
      description: String(line.description).trim(),
      amount: fromPaisa(toPaisa(line.amount)),
    };
  }
  const base = {
    kind: line.kind,
    quantity: Number(line.quantity),
    unitCost: fromPaisa(toPaisa(line.unitCost)),
  };
  if (line.kind === 'stock') return { ...base, itemId: line.itemId };
  const out = {
    ...base,
    name: String(line.name).trim(),
    category: String(line.category).trim(),
  };
  const location = trimOrUndef(line.location);
  if (location) out.location = location;
  if (line.condition) out.condition = line.condition;
  return out;
}

/** Purchase form values → POST /inventory/purchases payload. */
export function buildPurchasePayload(values = {}) {
  const totals = purchaseTotals(values.lines, values.paidAmount);
  const payload = {
    supplierId: values.supplierId,
    date: values.date,
    lines: (values.lines || []).map(purchaseLineToPayload),
    paidAmount: totals.paid,
  };
  if (values.branchId) payload.branchId = values.branchId;
  const bill = trimOrUndef(values.billNumber);
  if (bill) payload.billNumber = bill;
  if (totals.paidPaisa > 0) {
    payload.paymentMethod = values.paymentMethod === 'bank' ? 'bank' : 'cash';
    if (values.ledgerAccountId) payload.ledgerAccountId = values.ledgerAccountId;
  }
  return payload;
}

/* --------------------------- Stock & issues --------------------------- */

/** Low-stock flag: reorder level set (> 0) and quantity at or below it. */
export function isLowStock(quantity, reorderLevel) {
  const level = qtyUnits(reorderLevel);
  if (level <= 0) return false;
  return qtyUnits(quantity) <= level;
}

/** The branch stock figures of an item row (tolerates flat or nested `stock`). */
export function itemStock(row) {
  const s = row?.stock && typeof row.stock === 'object' ? row.stock : row || {};
  const quantity = Number(s.quantity ?? row?.quantity) || 0;
  const avgCost = Number(s.avgCost ?? row?.avgCost) || 0;
  const value =
    s.value !== undefined || row?.value !== undefined
      ? Number(s.value ?? row?.value) || 0
      : fromPaisa(lineAmountPaisa(quantity, avgCost));
  const lowStock =
    typeof row?.lowStock === 'boolean' ? row.lowStock : isLowStock(quantity, row?.reorderLevel);
  return { quantity, avgCost, value, lowStock };
}

/**
 * Shortfalls when issuing/selling `lines` ([{ itemId, quantity }]) against
 * `available` ({ [itemId]: qty }). The same item on several lines is summed.
 * Returns [{ itemId, requested, available }] — empty when everything fits.
 */
export function stockShortfalls(lines = [], available = {}) {
  const wanted = new Map();
  for (const l of lines || []) {
    if (!l?.itemId) continue;
    wanted.set(l.itemId, (wanted.get(l.itemId) || 0) + qtyUnits(l.quantity));
  }
  const out = [];
  for (const [itemId, units] of wanted) {
    const have = qtyUnits(available?.[itemId] ?? 0);
    if (units > have) out.push({ itemId, requested: units / 100, available: have / 100 });
  }
  return out;
}

/** Field errors for one issue / sale line ({} when valid). */
export function validateQtyLine(line, available) {
  const errors = {};
  if (!line?.itemId) errors.itemId = 'Pick an item';
  if (!isPositiveQty(line?.quantity)) errors.quantity = 'Quantity greater than 0 (max 2 decimals)';
  else if (available !== undefined && qtyUnits(line.quantity) > qtyUnits(available))
    errors.quantity = `Only ${Number(available) || 0} available`;
  return errors;
}

/** Adjustment line: non-zero signed delta + reason; a loss cannot exceed stock. */
export function validateAdjustmentLine(line, available) {
  const errors = {};
  if (!line?.itemId) errors.itemId = 'Pick an item';
  const s = String(line?.quantityDelta ?? '').trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(s) || qtyUnits(s) === 0)
    errors.quantityDelta = 'Enter a non-zero quantity (e.g. -2 or 5)';
  else if (available !== undefined && qtyUnits(s) < 0 && -qtyUnits(s) > qtyUnits(available))
    errors.quantityDelta = `Only ${Number(available) || 0} in stock`;
  if (!String(line?.reason ?? '').trim()) errors.reason = 'Reason is required';
  return errors;
}

/* -------------------------------- Shop -------------------------------- */

/** Sale total in paisa: Σ qty × unit price. */
export function saleTotalPaisa(lines = []) {
  return (lines || []).reduce((sum, l) => sum + lineAmountPaisa(l?.quantity, l?.unitPrice), 0);
}

/* ------------------------------ Suppliers ----------------------------- */

/** '' when a supplier payment of `amount` is allowed against `balance`, else an error. */
export function validateSupplierPayment(amount, balance) {
  if (!isMoneyInput(amount) || toPaisa(amount) <= 0) return 'Enter an amount greater than 0';
  if (toPaisa(amount) > toPaisa(balance))
    return `Amount cannot exceed the supplier balance (${fromPaisa(toPaisa(balance))})`;
  return '';
}

/* ------------------------------- Assets ------------------------------- */

/** Status options a user may move an asset to with PATCH /status. */
export function assetStatusTargets(current) {
  if (!ASSET_ACTIVE_STATUSES.includes(current)) return [];
  return ASSET_ACTIVE_STATUSES.filter((s) => s !== current);
}

/** Disposal value check: ≥ 0, ≤ cost; '' when fine. */
export function validateDisposalValue(value, cost) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  if (!isMoneyInput(s)) return 'Enter a valid amount';
  if (toPaisa(s) > toPaisa(cost)) return 'Disposal value cannot exceed the asset cost';
  return '';
}

/* ------------------------------- Misc --------------------------------- */

/** Display name of a populated ref (`{ name }`, `{ user: { name } }`) or a fallback. */
export function refName(ref, fallback = '—') {
  if (!ref || typeof ref !== 'object') return fallback;
  return ref.user?.name || ref.userId?.name || ref.name || fallback;
}

/** Escapes text for the printable HTML sheets. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Plain printable HTML document: a title, optional subtitle lines and one
 * table. `rows` are arrays of cell strings (escaped here).
 */
export function buildPrintHtml({ title, subtitle = [], headers = [], rows = [], footer = '' }) {
  const th = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('');
  const subs = (Array.isArray(subtitle) ? subtitle : [subtitle])
    .filter(Boolean)
    .map((s) => `<p>${escapeHtml(s)}</p>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;font-size:12px;margin:16px}
h1{font-size:18px;margin:0 0 4px}p{margin:2px 0;color:#333}
table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{border:1px solid #999;padding:4px 6px;text-align:left}th{background:#eee}
.foot{margin-top:10px;font-weight:bold}
@page{margin:12mm}
</style></head><body><h1>${escapeHtml(title)}</h1>${subs}
<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>
${footer ? `<p class="foot">${escapeHtml(footer)}</p>` : ''}
</body></html>`;
}
