import { useQuery, keepPreviousData } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useUserStore } from "@/store/userStore";
import { retryUnlessRefused } from "@/utils/seatRefusal";

// All dashboard routes are GET, auto-scoped to the logged-in student by the
// backend (never send studentId/classId/sectionId). Responses are shaped
// { status, message, data, total? } — these hooks unwrap to `data`.

const unwrap = (res) => res.data?.data;

// Cached data is per student: the signed-in user's id is part of every query
// key, so a different student on the same browser never reads this one's cache.
const useUid = () => useUserStore((s) => s.user?._id || s.user?.id || null);

// 3.1 Profile card
export function useProfile() {
  const uid = useUid();
  return useQuery({
    queryKey: ["dashboard", uid, "me"],
    queryFn: async () => unwrap(await apiClient.get("/dashboard/student/me")),
  });
}

// 3.2 Attendance — omit month for the whole academic year, or pass "YYYY-MM".
export function useAttendance(month) {
  const uid = useUid();
  return useQuery({
    queryKey: ["dashboard", uid, "attendance", month || "year"],
    queryFn: async () =>
      unwrap(
        await apiClient.get("/dashboard/student/attendance", {
          params: month ? { month } : undefined,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

// 3.3 Exam results
export function useResults() {
  const uid = useUid();
  return useQuery({
    queryKey: ["dashboard", uid, "results"],
    queryFn: async () =>
      unwrap(await apiClient.get("/dashboard/student/results")),
  });
}

// 3.4 Fees — { summary, vouchers, page, limit, total }. Void vouchers are left
// out; the list is paged (newest first, 24 a page by default) while
// `summary.outstandingBalance` covers every voucher.
export function useFees({ page = 1 } = {}) {
  const uid = useUid();
  return useQuery({
    queryKey: ["dashboard", uid, "fees", page],
    queryFn: async () =>
      unwrap(
        await apiClient.get("/dashboard/student/fees", { params: { page } }),
      ),
    placeholderData: keepPreviousData,
  });
}

// 3.5 Timetable — already grouped by weekday, Monday→Sunday.
export function useTimetable() {
  const uid = useUid();
  return useQuery({
    queryKey: ["dashboard", uid, "timetable"],
    queryFn: async () =>
      unwrap(await apiClient.get("/dashboard/student/timetable")),
  });
}

// 3.6 Announcements (paginated). Returns the full axios body so callers can
// read both `data` (the page) and `total` (full count) for the pager.
export function useAnnouncements({ page = 1, limit = 20 } = {}) {
  const uid = useUid();
  return useQuery({
    queryKey: ["dashboard", uid, "announcements", page, limit],
    retry: retryUnlessRefused,
    queryFn: async () => {
      const res = await apiClient.get("/dashboard/student/announcements", {
        params: { page, limit },
      });
      return { items: res.data?.data || [], total: res.data?.total || 0 };
    },
    placeholderData: keepPreviousData,
  });
}

// 3.7 Library (read-only): own open loans, recent history and fines —
// { openLoans, history, pendingFines, billedFines, billedUnpaidFines? }.
export function useLibrary() {
  const uid = useUid();
  return useQuery({
    queryKey: ["dashboard", uid, "library"],
    queryFn: async () =>
      unwrap(await apiClient.get("/dashboard/student/library")),
  });
}

// 3.8 Library catalogue of the student's branch (search + paginated).
// Returns the page items plus `total` for the pager.
export function useLibraryCatalogue({
  search = "",
  page = 1,
  limit = 20,
} = {}) {
  const uid = useUid();
  const q = search.trim();
  return useQuery({
    queryKey: ["dashboard", uid, "library-catalogue", q, page, limit],
    retry: retryUnlessRefused,
    queryFn: async () => {
      const res = await apiClient.get("/dashboard/student/library/catalogue", {
        params: { ...(q ? { search: q } : {}), page, limit },
      });
      return {
        items: Array.isArray(res.data?.data) ? res.data.data : [],
        total: res.data?.total || 0,
      };
    },
    placeholderData: keepPreviousData,
  });
}
