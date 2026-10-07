import apiClient from '@/services/apiClient';

export const fetchData = async ({
  url,
  page = 1,
  limit = 20,
  columnFilters = [],
  columnFiltersOr = [],
  token: _token, // kept for call-site compatibility, interceptor handles auth
  ...extraParams
}) => {
  const { data } = await apiClient.get(url, {
    params: {
      page,
      limit,
      columnFilters: JSON.stringify(columnFilters),
      columnFiltersOr: JSON.stringify(columnFiltersOr),
      ...extraParams,
    },
  });
  return data;
};

// Re-throws an axios failure as a plain Error carrying the server's message,
// plus the HTTP `status` so callers can branch on it (see utils/queryError.js).
const toApiError = (error) => {
  const err = new Error(error.response?.data?.message || error.message || 'Failed');
  if (error.response?.status) err.status = error.response.status;
  return err;
};

const isFormData = (v) => typeof FormData !== 'undefined' && v instanceof FormData;

// Let the browser set the multipart boundary by clearing the JSON default.
const buildConfig = (payload, params, headers) => {
  const config = { params };
  if (headers) config.headers = { ...headers };
  if (isFormData(payload)) config.headers = { ...config.headers, 'Content-Type': undefined };
  return config;
};

// `headers` carries per-request extras such as `Idempotency-Key`.
export const postData = async ({ url, payload = {}, token: _token, params = {}, headers }) => {
  try {
    const { data } = await apiClient.post(url, payload, buildConfig(payload, params, headers));
    return data;
  } catch (error) {
    throw toApiError(error);
  }
};

// Like postData, but also returns the HTTP status for endpoints whose status
// carries meaning (e.g. 201 created vs 200 linked an existing record).
export const postDataWithStatus = async ({ url, payload = {}, params = {}, headers }) => {
  try {
    const res = await apiClient.post(url, payload, buildConfig(payload, params, headers));
    return { status: res.status, body: res.data };
  } catch (error) {
    throw toApiError(error);
  }
};

export const putData = async ({ url, payload = {}, token: _token, params = {} }) => {
  try {
    const { data } = await apiClient.put(url, payload, buildConfig(payload, params));
    return data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const patchData = async ({ url, payload = {}, token: _token, params = {} }) => {
  try {
    const { data } = await apiClient.patch(url, payload, { params });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const deleteData = async ({ url, token: _token, params = {} }) => {
  try {
    const { data } = await apiClient.delete(url, { params });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
};
