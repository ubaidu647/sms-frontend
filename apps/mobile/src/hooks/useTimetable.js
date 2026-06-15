import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import apiClient from '../services/apiClient';
import { fetchData } from '../services/api';

// ────────────── Period Configs ──────────────

export function usePeriodConfigs({ branchId, isActive = true, enabled = true }) {
  return useQuery({
    queryKey: ['period-configs', branchId || ''],
    queryFn: () =>
      fetchData({
        url: '/timetable/period-config/list',
        branchId: branchId || undefined,
        isActive,
      }),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreatePeriodConfig({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/timetable/period-config', payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['period-configs'] });
      Toast.show({ type: 'success', text1: res?.message || 'Config created' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed';
      Toast.show({ type: 'error', text1: 'Create failed', text2: msg });
    },
  });
}

export function useUpdatePeriodConfig({ id, onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put(`/timetable/period-config/${id}`, payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['period-configs'] });
      Toast.show({ type: 'success', text1: res?.message || 'Config updated' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Update failed';
      Toast.show({ type: 'error', text1: 'Update failed', text2: msg });
    },
  });
}

export function useDeletePeriodConfig({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/timetable/period-config/${id}`);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['period-configs'] });
      Toast.show({ type: 'success', text1: res?.message || 'Config deleted' });
      onSuccess?.(res);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Delete failed';
      Toast.show({ type: 'error', text1: 'Failed', text2: msg });
    },
  });
}

// ────────────── Slots / Views ──────────────

export function useSectionTimetable({ sectionId, academicYear, enabled = true }) {
  return useQuery({
    queryKey: ['section-timetable', sectionId, academicYear],
    queryFn: () =>
      fetchData({ url: `/timetable/section/${sectionId}`, academicYear }),
    enabled: enabled && !!sectionId && !!academicYear,
    staleTime: 0,
  });
}

export function useTeacherTimetable({ staffId, academicYear, enabled = true }) {
  return useQuery({
    queryKey: ['teacher-timetable', staffId, academicYear],
    queryFn: () =>
      fetchData({ url: `/timetable/teacher/${staffId}`, academicYear }),
    enabled: enabled && !!staffId,
    staleTime: 30_000,
  });
}

export function useBulkSaveSlots({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/timetable/bulk', payload);
      return data;
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['section-timetable', vars.sectionId, vars.academicYear],
      });
      queryClient.invalidateQueries({ queryKey: ['timetable-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-timetable'] });
      Toast.show({
        type: 'success',
        text1: 'Timetable saved',
        text2: `${res?.data?.created ?? 0} slots`,
      });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Save failed';
      Toast.show({ type: 'error', text1: 'Save failed', text2: msg });
    },
  });
}

// ────────────── Reports ──────────────

export function useLiveNow({ branchId, enabled = true, refetchKey = 0 }) {
  return useQuery({
    queryKey: ['timetable-now', branchId || '', refetchKey],
    queryFn: () =>
      fetchData({ url: '/timetable/now', branchId: branchId || undefined }),
    enabled,
    staleTime: 0,
  });
}

export function useFreeTeachers({
  day,
  periodNumber,
  academicYear,
  branchId,
  enabled = true,
}) {
  return useQuery({
    queryKey: ['free-teachers', day, periodNumber, academicYear, branchId || ''],
    queryFn: () =>
      fetchData({
        url: '/timetable/free-teachers',
        day,
        periodNumber,
        academicYear,
        branchId: branchId || undefined,
      }),
    enabled: enabled && !!day && !!periodNumber && !!academicYear,
    staleTime: 0,
  });
}

export function useConflicts({ academicYear, branchId, enabled = true }) {
  return useQuery({
    queryKey: ['timetable-conflicts', academicYear, branchId || ''],
    queryFn: () =>
      fetchData({
        url: '/timetable/conflicts',
        academicYear,
        branchId: branchId || undefined,
      }),
    enabled: enabled && !!academicYear,
    staleTime: 0,
  });
}

// ────────────── Helpers ──────────────

export function useClassesForTT({ branchId, academicYear, enabled = true }) {
  return useQuery({
    queryKey: ['classes-for-tt', branchId || '', academicYear || ''],
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

export function useSectionsForTT({ classId, enabled = true }) {
  return useQuery({
    queryKey: ['sections-for-tt', classId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/class/${classId}/sections`);
      return data;
    },
    enabled: enabled && !!classId,
    staleTime: 60_000,
  });
}

export function useSubjectsForTT({ classId, academicYear, enabled = true }) {
  return useQuery({
    queryKey: ['subjects-for-tt', classId, academicYear || ''],
    queryFn: () =>
      fetchData({
        url: '/subject/list',
        page: 1,
        limit: 200,
        classId,
        academicYear: academicYear || undefined,
        isActive: 'true',
      }),
    enabled: enabled && !!classId,
    staleTime: 30_000,
  });
}

export function useTeachingStaffForTT({ branchId, enabled = true }) {
  return useQuery({
    queryKey: ['teaching-staff-for-tt', branchId || ''],
    queryFn: () =>
      fetchData({
        url: '/staff/list',
        page: 1,
        limit: 500,
        staffType: 'teaching',
        branchId: branchId || undefined,
      }),
    enabled,
    staleTime: 30_000,
  });
}
