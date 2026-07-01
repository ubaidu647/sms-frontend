// WhatsApp integration API — branch-scoped settings + the unofficial (Baileys)
// session/QR flow. Mirrors the backend contract under /whatsapp/*.
// Auth is attached by the apiClient request interceptor; errors are normalised
// to `Error(message)` so mutations can surface `err.message` directly.
//
// NOTE: the documented routes are `/api/whatsapp/*`, but apiClient's baseURL
// already carries the `/api` prefix (every other service uses bare paths like
// `/package/list`), so we use `/whatsapp/*` here to match.
import apiClient from '@/services/apiClient';

const unwrap = (res) => res.data; // envelope: { status, message, data, total }

const normalizeError = (error) => {
  throw new Error(error.response?.data?.message || error.message || 'Request failed');
};

/* ------------------------------- Settings ------------------------------- */

// Current branch settings. `data` is null when nothing is configured yet.
// Org-admins with no branch get an ARRAY of every branch's settings.
export const getMySettings = async () => {
  try {
    return unwrap(await apiClient.get('/whatsapp/settings/me'));
  } catch (error) {
    normalizeError(error);
  }
};

// A specific branch's settings (multi-branch admin).
export const getBranchSettings = async (branchId) => {
  try {
    return unwrap(await apiClient.get(`/whatsapp/settings/branch/${branchId}`));
  } catch (error) {
    normalizeError(error);
  }
};

// Create or update — deep-merges, so send only the fields you changed.
// Multi-branch admin: include `branchId` in the payload to target a branch.
export const upsertSettings = async (payload) => {
  try {
    return unwrap(await apiClient.post('/whatsapp/settings/upsert', payload));
  } catch (error) {
    normalizeError(error);
  }
};

/* ------------------ Unofficial (Baileys) session / QR ------------------- */

// Start a QR login. Returns { status, qr? }. `branchId` optional (org-admin).
export const connectSession = async (branchId) => {
  try {
    return unwrap(await apiClient.post('/whatsapp/session/connect', branchId ? { branchId } : {}));
  } catch (error) {
    normalizeError(error);
  }
};

// Poll the session. Returns { status, qr?, connectedNumber? }.
export const getSessionStatus = async (branchId) => {
  try {
    return unwrap(
      await apiClient.get('/whatsapp/session/status', {
        params: branchId ? { branchId } : {},
      }),
    );
  } catch (error) {
    normalizeError(error);
  }
};

// End + wipe the session. `branchId` optional (org-admin).
export const logoutSession = async (branchId) => {
  try {
    return unwrap(await apiClient.post('/whatsapp/session/logout', branchId ? { branchId } : {}));
  } catch (error) {
    normalizeError(error);
  }
};
