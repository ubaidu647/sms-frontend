import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import apiClient from '../services/apiClient';
import { fetchData } from '../services/api';

export function useAssignmentsList({
  page = 1,
  limit = 20,
  filters,
  branchId,
  enabled = true,
}) {
  const params = {
    staffId: filters?.staffId || undefined,
    subjectId: filters?.subjectId || undefined,
    classId: filters?.classId || undefined,
    sectionId: filters?.sectionId || undefined,
    academicYear: filters?.academicYear || undefined,
    role: filters?.role || undefined,
    isPrimary: filters?.isPrimary === '' ? undefined : filters?.isPrimary,
    isActive: filters?.isActive === '' ? undefined : filters?.isActive,
    branchId: branchId || undefined,
  };
  return useQuery({
    queryKey: ['teacher-assignments', page, limit, params],
    queryFn: () =>
      fetchData({ url: '/teaching-assignment/list', page, limit, ...params }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAssignmentDetail({ id, enabled = true }) {
  return useQuery({
    queryKey: ['assignment-detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/teaching-assignment/${id}`);
      return data?.data;
    },
    enabled: enabled && !!id,
    staleTime: 30_000,
  });
}

export function useAssignmentsByTeacher({ staffId, academicYear, isActive, enabled = true }) {
  return useQuery({
    queryKey: ['assignment-by-teacher', staffId, academicYear || '', isActive ?? ''],
    queryFn: async () => {
      const { data } = await apiClient.get(`/teaching-assignment/teacher/${staffId}`, {
        params: {
          academicYear: academicYear || undefined,
          isActive: isActive === '' ? undefined : isActive,
        },
      });
      return data?.data;
    },
    enabled: enabled && !!staffId,
    staleTime: 30_000,
  });
}

export function useAssignmentsBySection({ sectionId, isActive, enabled = true }) {
  return useQuery({
    queryKey: ['assignment-by-section', sectionId, isActive ?? ''],
    queryFn: async () => {
      const { data } = await apiClient.get(`/teaching-assignment/section/${sectionId}`, {
        params: { isActive: isActive === '' ? undefined : isActive },
      });
      return data?.data;
    },
    enabled: enabled && !!sectionId,
    staleTime: 30_000,
  });
}

export function useCreateAssignment({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/teaching-assignment/create', payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-by-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-by-section'] });
      Toast.show({ type: 'success', text1: res?.message || 'Teacher assigned' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to assign';
      Toast.show({ type: 'error', text1: 'Assign failed', text2: msg });
    },
  });
}

export function useBulkCreateAssignments({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/teaching-assignment/bulk-create', payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-by-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-by-section'] });
      const d = res?.data;
      Toast.show({
        type: 'success',
        text1: 'Bulk assignment done',
        text2: `${d?.createdCount || 0} created · ${d?.skippedCount || 0} skipped`,
      });
      onSuccess?.(d);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Bulk failed';
      Toast.show({ type: 'error', text1: 'Bulk failed', text2: msg });
    },
  });
}

export function useUpdateAssignment({ id, onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put(`/teaching-assignment/${id}`, payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['assignment-by-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-by-section'] });
      Toast.show({ type: 'success', text1: res?.message || 'Assignment updated' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Update failed';
      Toast.show({ type: 'error', text1: 'Update failed', text2: msg });
    },
  });
}

export function useDeleteAssignment({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/teaching-assignment/${id}`);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-by-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-by-section'] });
      Toast.show({ type: 'success', text1: res?.message || 'Teacher unassigned' });
      onSuccess?.(res);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Delete failed';
      Toast.show({ type: 'error', text1: 'Failed', text2: msg });
    },
  });
}

// Helper dropdowns scoped for assignments — distinct query keys so they
// don't collide with the generic dropdowns used elsewhere.

export function useSectionsForClass({ classId, enabled = true }) {
  return useQuery({
    queryKey: ['sections-for-class', classId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/class/${classId}/sections`);
      return data;
    },
    enabled: enabled && !!classId,
    staleTime: 60_000,
  });
}

export function useSubjectsForClass({ classId, academicYear, enabled = true }) {
  return useQuery({
    queryKey: ['subjects-for-class', classId, academicYear || ''],
    queryFn: () =>
      fetchData({
        url: '/subject/list',
        page: 1,
        limit: 200,
        classId,
        academicYear: academicYear || undefined,
      }),
    enabled: enabled && !!classId,
    staleTime: 30_000,
  });
}

export function useClassesForFilter({ branchId, academicYear, enabled = true }) {
  return useQuery({
    queryKey: ['classes-for-assignment', branchId || '', academicYear || ''],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        branchId: branchId || undefined,
        academicYear: academicYear || undefined,
      }),
    enabled,
    staleTime: 30_000,
  });
}

export function useTeachingStaffForFilter({ branchId, enabled = true }) {
  return useQuery({
    queryKey: ['staff-teaching-for-assignment', branchId || ''],
    queryFn: () =>
      fetchData({
        url: '/staff/list',
        page: 1,
        limit: 200,
        staffType: 'teaching',
        branchId: branchId || undefined,
        isActive: 'true',
      }),
    enabled,
    staleTime: 30_000,
  });
}
