import axios from 'axios';

export const fetchData = async ({
  url,
  page = 1,
  limit = 20,
  columnFilters = [],
  columnFiltersOr = [],
  token,
  ...extraParams
}) => {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`, {
    params: {
      page,
      limit,
      columnFilters: JSON.stringify(columnFilters),
      columnFiltersOr: JSON.stringify(columnFiltersOr),
      ...extraParams, // any additional params
    },
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  return data; // whatever the API returns
};

export const postData = async ({ url, payload = {}, token, params = {} }) => {
  try {
    const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      params,
    });
    return data;
  } catch (error) {
    // This is critical!
    throw new Error(error.response?.data?.message || error.message || 'Failed');
  }
};
