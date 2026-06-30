import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';

// All dashboard routes are GET, auto-scoped to the logged-in student by the
// backend (never send studentId/classId/sectionId). Responses are shaped
// { status, message, data, total? } — these hooks unwrap to `data`.

const unwrap = (res) => res.data?.data;

// 3.1 Profile card
export function useProfile() {
  return useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: async () => unwrap(await apiClient.get('/dashboard/student/me')),
  });
}

// 3.2 Attendance — omit month for the whole academic year, or pass "YYYY-MM".
export function useAttendance(month) {
  return useQuery({
    queryKey: ['dashboard', 'attendance', month || 'year'],
    queryFn: async () =>
      unwrap(
        await apiClient.get('/dashboard/student/attendance', {
          params: month ? { month } : undefined,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

// 3.3 Exam results
export function useResults() {
  return useQuery({
    queryKey: ['dashboard', 'results'],
    queryFn: async () => unwrap(await apiClient.get('/dashboard/student/results')),
  });
}

// 3.4 Fees
export function useFees() {
  return useQuery({
    queryKey: ['dashboard', 'fees'],
    queryFn: async () => unwrap(await apiClient.get('/dashboard/student/fees')),
  });
}

// 3.5 Timetable — already grouped by weekday, Monday→Sunday.
export function useTimetable() {
  return useQuery({
    queryKey: ['dashboard', 'timetable'],
    queryFn: async () => unwrap(await apiClient.get('/dashboard/student/timetable')),
  });
}

// 3.6 Announcements (paginated). Returns the full axios body so callers can
// read both `data` (the page) and `total` (full count) for the pager.
export function useAnnouncements({ page = 1, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'announcements', page, limit],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/student/announcements', {
        params: { page, limit },
      });
      return { items: res.data?.data || [], total: res.data?.total || 0 };
    },
    placeholderData: keepPreviousData,
  });
}
