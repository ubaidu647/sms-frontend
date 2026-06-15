import apiClient from './apiClient';

export const fetchData = async ({
  url,
  page = 1,
  limit = 20,
  columnFilters,
  columnFiltersOr,
  ...extraParams
}) => {
  const { data } = await apiClient.get(url, {
    params: {
      page,
      limit,
      columnFilters: JSON.stringify(columnFilters ?? []),
      columnFiltersOr: JSON.stringify(columnFiltersOr ?? []),
      ...extraParams,
    },
  });
  return data;
};
