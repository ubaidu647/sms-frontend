import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useUserStore } from "@/store/userStore";
import { useSelectedChildId } from "@/hooks/useChildren";
import { childPath, keepSameChildData } from "@/hooks/useDashboard";

// The selected child's leave requests:
//   GET   /dashboard/parent/children/:studentId/leave?page=&limit=
//   POST  /dashboard/parent/children/:studentId/leave
//         { leaveType, fromDate, toDate, reason } → 201 (pending)
//   PATCH /dashboard/parent/children/:studentId/leave/:id/cancel
//         (only PENDING requests a parent created)
// Writes go through apiClient, which adds the CSRF header.

const useUid = () => useUserStore((s) => s.user?._id || s.user?.id || null);

// Key layout matches useDashboard (third entry = child id) so
// keepSameChildData never shows another child's list after a switch.
const leaveKey = (uid, studentId) => ["leave", uid, studentId];

export function useLeaveRequests({ page = 1, limit = 20 } = {}) {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: [...leaveKey(uid, studentId), "list", page, limit],
    queryFn: async () => {
      const res = await apiClient.get(childPath(studentId, "leave"), {
        params: { page, limit },
      });
      return { items: res.data?.data || [], total: res.data?.total || 0 };
    },
    enabled: !!studentId,
    placeholderData: keepSameChildData(studentId),
  });
}

// After a write: the child's leave list and attendance (an approved/cancelled
// leave changes the register and the percentage).
function useInvalidateChildLeave() {
  const qc = useQueryClient();
  const uid = useUid();
  return (studentId) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: leaveKey(uid, studentId) }),
      qc.invalidateQueries({
        queryKey: ["dashboard", uid, studentId, "attendance"],
      }),
    ]);
}

// The child id is captured at mutate time (not read at settle time) so a
// switch mid-request still refreshes the child the request was made for.
export function useApplyLeave() {
  const studentId = useSelectedChildId();
  const invalidate = useInvalidateChildLeave();
  return useMutation({
    mutationFn: async (body) => {
      const res = await apiClient.post(childPath(studentId, "leave"), body);
      return { studentId, data: res.data?.data };
    },
    onSuccess: ({ studentId: sid }) => invalidate(sid),
  });
}

export function useCancelLeave() {
  const studentId = useSelectedChildId();
  const invalidate = useInvalidateChildLeave();
  return useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.patch(
        childPath(studentId, `leave/${encodeURIComponent(id)}/cancel`),
      );
      return { studentId, data: res.data?.data };
    },
    onSuccess: ({ studentId: sid }) => invalidate(sid),
  });
}

// Server message for a failed write (400 validation, 409 overlap, …).
export function leaveErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    (error?.response ? fallback : "Can't reach the server. Please try again.")
  );
}
