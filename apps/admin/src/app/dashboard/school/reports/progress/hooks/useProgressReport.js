import { useMutation } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';

// POST /report/student-progress → { data: { student, dateRange, modules, report } }
// Returns the inner `data` object on success. Errors propagate so the caller can
// surface the backend message (400/401/403/404) verbatim via toast.
export const useProgressReport = (options = {}) =>
  useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post('/report/student-progress', payload);
      return res.data?.data;
    },
    ...options,
  });
