// Billing API — packages + subscriptions (super-admin scope).
// Mirrors the backend contract documented for /api/package/* and /api/subscription/*.
// Auth is attached by the apiClient request interceptor; errors are normalised to
// `Error(message)` so callers (mutations) can surface `err.message` directly.
import apiClient from '@/services/apiClient';

const unwrap = (res) => res.data; // backend envelope: { status, message, data, total }

const normalizeError = (error) => {
  throw new Error(error.response?.data?.message || error.message || 'Request failed');
};

// Drop undefined/empty values so we never send `?search=&isActive=` noise.
const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  );

/* ------------------------------- Packages ------------------------------- */

export const listPackages = async ({ page = 1, limit = 20, isActive, search } = {}) => {
  try {
    const res = await apiClient.get('/package/list', {
      params: cleanParams({ page, limit, isActive, search }),
    });
    return unwrap(res); // { data: Package[], total }
  } catch (error) {
    normalizeError(error);
  }
};

export const getPackage = async (id) => {
  try {
    const res = await apiClient.get(`/package/${id}`);
    return unwrap(res);
  } catch (error) {
    normalizeError(error);
  }
};

export const createPackage = async (payload) => {
  try {
    const res = await apiClient.post('/package/create', payload);
    return unwrap(res);
  } catch (error) {
    normalizeError(error);
  }
};

// PATCH accepts any subset of create fields. When `limits` is included it must
// carry all four numbers (the backend treats it as a whole object).
export const updatePackage = async (id, payload) => {
  try {
    const res = await apiClient.patch(`/package/${id}`, payload);
    return unwrap(res);
  } catch (error) {
    normalizeError(error);
  }
};

// Soft delete — sets isActive:false, never hard-deletes.
export const deletePackage = async (id) => {
  try {
    const res = await apiClient.delete(`/package/${id}`);
    return unwrap(res);
  } catch (error) {
    normalizeError(error);
  }
};

/* ----------------------------- Subscriptions ---------------------------- */

// Current active subscription for a school. A 404 means "no active subscription"
// rather than a hard failure, so we resolve it to `{ data: null }`.
export const getCurrentSubscription = async (schoolId) => {
  try {
    const res = await apiClient.get(`/subscription/school/${schoolId}/current`);
    return unwrap(res);
  } catch (error) {
    if (error.response?.status === 404) return { data: null };
    normalizeError(error);
  }
};

// Full history, newest-first (walk previousSubscriptionId for the timeline).
export const getSubscriptionHistory = async (schoolId) => {
  try {
    const res = await apiClient.get(`/subscription/school/${schoolId}`);
    return unwrap(res); // { data: Subscription[], total }
  } catch (error) {
    normalizeError(error);
  }
};

// Assign a plan to a school that currently has NO active subscription.
// payload: { schoolId, packageId, customLimits?, paymentInfo? }
export const assignSubscription = async (payload) => {
  try {
    const res = await apiClient.post('/subscription/assign', payload);
    return unwrap(res); // { subscription, invoiceId, amountDue, credit }
  } catch (error) {
    normalizeError(error);
  }
};

// Upgrade/downgrade — direction auto-detected by price. Fresh full cycle.
// payload: { schoolId, packageId, paymentInfo? }
export const changePackage = async (payload) => {
  try {
    const res = await apiClient.post('/subscription/change', payload);
    return unwrap(res);
  } catch (error) {
    normalizeError(error);
  }
};

// Renew same package, fresh cycle, re-snapshots current catalog pricing.
// payload: { schoolId, paymentInfo? }
export const renewSubscription = async (payload) => {
  try {
    const res = await apiClient.post('/subscription/renew', payload);
    return unwrap(res);
  } catch (error) {
    normalizeError(error);
  }
};

// Cancel current sub + clear school.currentSubscriptionId.
export const cancelSubscription = async (schoolId) => {
  try {
    const res = await apiClient.post('/subscription/cancel', { schoolId });
    return unwrap(res);
  } catch (error) {
    normalizeError(error);
  }
};

/* --------------------- School-admin self-serve (/me) -------------------- */
// schoolId is taken from the token — never sent. These are READ-ONLY: a school
// admin can view its own subscription + invoices but cannot assign/change/renew
// or mark invoices paid (those stay super-admin only). A super-admin (no school)
// hits 400 "No school associated with this account" on these routes.

// Current active subscription for the logged-in school. 404 → no active sub.
export const getMyCurrentSubscription = async () => {
  try {
    const res = await apiClient.get('/subscription/me/current');
    return unwrap(res);
  } catch (error) {
    if (error.response?.status === 404) return { data: null };
    normalizeError(error);
  }
};

// Full subscription history for the logged-in school, newest-first.
export const getMySubscriptionHistory = async () => {
  try {
    const res = await apiClient.get('/subscription/me');
    return unwrap(res); // { data: Subscription[], total }
  } catch (error) {
    normalizeError(error);
  }
};

// Aggregate dues for the logged-in school. A 404 (no invoices) resolves to null.
export const getMyInvoiceSummary = async () => {
  try {
    const res = await apiClient.get('/invoice/me/summary');
    return unwrap(res);
  } catch (error) {
    if (error.response?.status === 404) return { data: null };
    normalizeError(error);
  }
};

// All invoices for the logged-in school, newest-first.
export const listMyInvoices = async () => {
  try {
    const res = await apiClient.get('/invoice/me');
    return unwrap(res); // { data: Invoice[], total }
  } catch (error) {
    normalizeError(error);
  }
};

/* ------------------------------- Invoices ------------------------------- */

// Every assign/change/renew creates an invoice (status: unpaid|paid|void) that
// carries the real amount due. These reads expose that billing trail.

// All invoices for a school, newest-first. { data: Invoice[], total }
export const listInvoices = async (schoolId) => {
  try {
    const res = await apiClient.get(`/invoice/school/${schoolId}`);
    return unwrap(res); // { data: Invoice[], total }
  } catch (error) {
    normalizeError(error);
  }
};

// Aggregate dues for a school. data: { totalDue, totalPaid, unpaidCount,
// paidCount, voidCount, invoiceCount }. A 404 (no invoices) resolves to null.
export const getInvoiceSummary = async (schoolId) => {
  try {
    const res = await apiClient.get(`/invoice/school/${schoolId}/summary`);
    return unwrap(res);
  } catch (error) {
    if (error.response?.status === 404) return { data: null };
    normalizeError(error);
  }
};

// The invoice tied to a single subscription (created when that sub was
// assigned/changed/renewed). 404 → no invoice for that subscription.
export const getInvoiceBySubscription = async (subscriptionId) => {
  try {
    const res = await apiClient.get(`/invoice/subscription/${subscriptionId}`);
    return unwrap(res);
  } catch (error) {
    if (error.response?.status === 404) return { data: null };
    normalizeError(error);
  }
};

// Mark an invoice paid — clears it from outstanding dues.
// paymentInfo: { method?, transactionId? }
export const markInvoicePaid = async (id, paymentInfo) => {
  try {
    const res = await apiClient.patch(`/invoice/${id}/pay`, paymentInfo ? { paymentInfo } : {});
    return unwrap(res);
  } catch (error) {
    normalizeError(error);
  }
};
