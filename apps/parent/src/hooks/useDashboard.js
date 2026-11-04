import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useUserStore } from "@/store/userStore";
import { useSelectedChildId } from "@/hooks/useChildren";

// Per-child dashboard routes: /dashboard/parent/children/:studentId/<x>. They
// take the same query params and return the same `data` shapes as the student
// portal's /dashboard/student/<x>. Responses are shaped
// { success, message, data, total? } — these hooks unwrap to `data`.

const unwrap = (res) => res.data?.data;

// Cached data is per parent AND per child: both ids are in every query key, so
// switching child refetches and another parent never reads this one's cache.
const useUid = () => useUserStore((s) => s.user?._id || s.user?.id || null);

// Keep the previous page/month on screen while the next one loads — but never
// another child's data after a switch (the key's third entry is the child id).
export const keepSameChildData =
  (studentId) => (previousData, previousQuery) =>
    previousQuery?.queryKey?.[2] === studentId ? previousData : undefined;

export const childPath = (studentId, rest) =>
  `/dashboard/parent/children/${encodeURIComponent(studentId)}/${rest}`;

// Profile card (the child's record)
export function useProfile() {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["dashboard", uid, studentId, "me"],
    queryFn: async () =>
      unwrap(await apiClient.get(childPath(studentId, "me"))),
    enabled: !!studentId,
  });
}

// Attendance — omit month for the whole academic year, or pass "YYYY-MM".
export function useAttendance(month) {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["dashboard", uid, studentId, "attendance", month || "year"],
    queryFn: async () =>
      unwrap(
        await apiClient.get(childPath(studentId, "attendance"), {
          params: month ? { month } : undefined,
        }),
      ),
    enabled: !!studentId,
    placeholderData: keepSameChildData(studentId),
  });
}

// Published exam results
export function useResults() {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["dashboard", uid, studentId, "results"],
    queryFn: async () =>
      unwrap(await apiClient.get(childPath(studentId, "results"))),
    enabled: !!studentId,
  });
}

// Fees (read-only) — { summary, vouchers, page, limit, total }. Void vouchers
// are left out; the list is paged (newest first, 24 a page by default) while
// `summary.outstandingBalance` covers every voucher.
export function useFees({ page = 1 } = {}) {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["dashboard", uid, studentId, "fees", page],
    queryFn: async () =>
      unwrap(
        await apiClient.get(childPath(studentId, "fees"), { params: { page } }),
      ),
    enabled: !!studentId,
    // Keep the previous page on screen while the next loads — but never
    // another child's vouchers.
    placeholderData: (prev, prevQuery) =>
      prevQuery?.queryKey?.[2] === studentId ? prev : undefined,
  });
}

// Timetable — already grouped by weekday, Monday→Sunday.
export function useTimetable() {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["dashboard", uid, studentId, "timetable"],
    queryFn: async () =>
      unwrap(await apiClient.get(childPath(studentId, "timetable"))),
    enabled: !!studentId,
  });
}

// Announcements (paginated). Returns the page items plus `total` for the pager.
export function useAnnouncements({ page = 1, limit = 20 } = {}) {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["dashboard", uid, studentId, "announcements", page, limit],
    queryFn: async () => {
      const res = await apiClient.get(childPath(studentId, "announcements"), {
        params: { page, limit },
      });
      return { items: res.data?.data || [], total: res.data?.total || 0 };
    },
    enabled: !!studentId,
    placeholderData: keepSameChildData(studentId),
  });
}

// Library (read-only): the child's open loans, recent history and fines —
// { openLoans, history, pendingFines, billedFines, billedUnpaidFines? }.
export function useLibrary() {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["dashboard", uid, studentId, "library"],
    queryFn: async () =>
      unwrap(await apiClient.get(childPath(studentId, "library"))),
    enabled: !!studentId,
  });
}

// Library catalogue of the child's branch (search + paginated).
// Returns the page items plus `total` for the pager.
export function useLibraryCatalogue({
  search = "",
  page = 1,
  limit = 20,
} = {}) {
  const uid = useUid();
  const studentId = useSelectedChildId();
  const q = search.trim();
  return useQuery({
    queryKey: [
      "dashboard",
      uid,
      studentId,
      "library-catalogue",
      q,
      page,
      limit,
    ],
    queryFn: async () => {
      const res = await apiClient.get(
        childPath(studentId, "library/catalogue"),
        { params: { ...(q ? { search: q } : {}), page, limit } },
      );
      return {
        items: Array.isArray(res.data?.data) ? res.data.data : [],
        total: res.data?.total || 0,
      };
    },
    enabled: !!studentId,
    placeholderData: keepSameChildData(studentId),
  });
}
