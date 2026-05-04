import apiClient from '@/services/apiClient';

export const fetchData = async ({
  url,
  page = 1,
  limit = 20,
  columnFilters = [],
  columnFiltersOr = [],
  token, // kept for call-site compatibility, interceptor handles auth
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

const isFormData = (v) => typeof FormData !== 'undefined' && v instanceof FormData;

// Let the browser set the multipart boundary by clearing the JSON default.
const buildConfig = (payload, params) => {
  const config = { params };
  if (isFormData(payload)) config.headers = { 'Content-Type': undefined };
  return config;
};

export const postData = async ({ url, payload = {}, token: _token, params = {} }) => {
  try {
    const { data } = await apiClient.post(url, payload, buildConfig(payload, params));
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed');
  }
};

export const putData = async ({ url, payload = {}, token: _token, params = {} }) => {
  try {
    const { data } = await apiClient.put(url, payload, buildConfig(payload, params));
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed');
  }
};

export const patchData = async ({ url, payload = {}, token: _token, params = {} }) => {
  try {
    const { data } = await apiClient.patch(url, payload, { params });
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed');
  }
};

export const deleteData = async ({ url, token: _token, params = {} }) => {
  try {
    const { data } = await apiClient.delete(url, { params });
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed');
  }
};
