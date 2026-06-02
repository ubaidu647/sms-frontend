import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import apiClient from '../services/apiClient';
import { fetchData } from '../services/api';

// Subjects list — for non-own scopes, hits /subject/list directly.
// Own-scope (teacher) lists are derived from /teaching-assignment/list
// because the backend filters subjects to assignments anyway.
export function useSubjectsList({
  page,
  limit,
  filters,
  branchId,
  enabled = true,
  ownScope = false,
}) {
  const params = {
    search: filters?.search || undefined,
    classId: filters?.classId || undefined,
    subjectType: filters?.subjectType || undefined,
    category: filters?.category || undefined,
    academicYear: filters?.academicYear || undefined,
    branchId: branchId || undefined,
    // backend coerces "true"/"false"; pass true/false strings to keep parity with web
    isActive: filters?.isActive === '' ? undefined : filters?.isActive,
  };

  return useQuery({
    queryKey: ['subjects', page, limit, params, ownScope],
    queryFn: async () => {
      if (ownScope) {
        // Mirror the web: pull assignments, dedupe subjects, apply
        // client-side search/type/category filters.
        const res = await fetchData({
          url: '/teaching-assignment/list',
          page: 1,
          limit: 500,
          academicYear: filters?.academicYear || undefined,
          classId: filters?.classId || undefined,
          isActive: filters?.isActive === '' ? undefined : filters?.isActive,
        });
        const assignments = res?.data || [];
        const seen = new Map();
        for (const a of assignments) {
          const s = a.subject;
          if (!s?._id || seen.has(s._id)) continue;
          seen.set(s._id, {
            _id: s._id,
            name: s.name,
            code: s.code,
            class: a.class || null,
            section: a.section || null,
            subjectType: s.subjectType,
            category: s.category,
            totalMarks: s.totalMarks,
            passingMarks: s.passingMarks,
            isActive: s.isActive ?? a.isActive,
          });
        }
        let derived = Array.from(seen.values());
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase();
          derived = derived.filter(
            (s) =>
              s.name?.toLowerCase().includes(q) ||
              s.code?.toLowerCase().includes(q),
          );
        }
        if (filters?.subjectType)
          derived = derived.filter((s) => s.subjectType === filters.subjectType);
        if (filters?.category)
          derived = derived.filter((s) => s.category === filters.category);
        const start = (page - 1) * limit;
        return { data: derived.slice(start, start + limit), total: derived.length };
      }
      return fetchData({ url: '/subject/list', page, limit, ...params });
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSubjectDetail(subjectId) {
  return useQuery({
    queryKey: ['subject-detail', subjectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/subject/${subjectId}`);
      return data?.data;
    },
    enabled: !!subjectId,
    staleTime: 30_000,
  });
}

export function useCreateSubject({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/subject/create', payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      Toast.show({ type: 'success', text1: res?.message || 'Subject created' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Could not create subject';
      Toast.show({ type: 'error', text1: 'Create failed', text2: msg });
    },
  });
}

export function useUpdateSubject({ subjectId, onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put(`/subject/${subjectId}`, payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subject-detail', subjectId] });
      Toast.show({ type: 'success', text1: res?.message || 'Subject updated' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Could not update subject';
      Toast.show({ type: 'error', text1: 'Update failed', text2: msg });
    },
  });
}

export function useToggleSubjectStatus({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subjectId) => {
      const { data } = await apiClient.patch(`/subject/${subjectId}/toggle-status`);
      return { ...data, subjectId };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subject-detail', res.subjectId] });
      Toast.show({ type: 'success', text1: res?.message || 'Status updated' });
      onSuccess?.(res);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Toggle failed';
      Toast.show({ type: 'error', text1: 'Toggle failed', text2: msg });
    },
  });
}

// Dropdown helper — classes scoped to a branch + (optionally) academic year.
export function useClassesDropdown({ branchId, academicYear, enabled = true } = {}) {
  return useQuery({
    queryKey: ['classes-dropdown', branchId || null, academicYear || null],
    queryFn: () => {
      const params = { page: 1, limit: 200 };
      if (branchId) params.branchId = branchId;
      if (academicYear) params.academicYear = academicYear;
      return fetchData({ url: '/class/list', ...params });
    },
    enabled,
    staleTime: 30_000,
  });
}
