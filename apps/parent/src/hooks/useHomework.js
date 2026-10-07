import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useUserStore } from "@/store/userStore";
import { useSelectedChildId } from "@/hooks/useChildren";
import { childPath, keepSameChildData } from "@/hooks/useDashboard";

// The selected child's homework (read-only: parents cannot submit). Same query
// params and `data` shapes as /dashboard/student/homework[/:id].

const unwrap = (res) => res.data?.data;

const useUid = () => useUserStore((s) => s.user?._id || s.user?.id || null);

// List (paginated). Items carry submissionStatus + mySubmission (the child's).
export function useHomeworkList({ page = 1, limit = 20 } = {}) {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["homework", uid, studentId, "list", page, limit],
    queryFn: async () => {
      const res = await apiClient.get(childPath(studentId, "homework"), {
        params: { page, limit },
      });
      return { items: res.data?.data || [], total: res.data?.total || 0 };
    },
    enabled: !!studentId,
    placeholderData: keepSameChildData(studentId),
  });
}

// End of the due day — mirrors the server's homeworkDueDeadline. A date-only
// due date is stored as UTC midnight and names that calendar day; any other
// instant is placed on the local calendar. Used only when the server did not
// send `isPastDue` itself.
function dueDeadline(dueDate) {
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  const utcMidnight =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;
  const end = utcMidnight
    ? new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  end.setHours(23, 59, 59, 999);
  return end;
}

// The detail endpoint returns the raw homework (subjectId populated) plus
// mySubmission; newer servers also derive submissionStatus / isPastDue /
// subject. Fill those in when absent so the page reads one shape.
export function normalizeHomeworkDetail(hw) {
  if (!hw) return hw;
  const subject =
    hw.subject ??
    (hw.subjectId && typeof hw.subjectId === "object" ? hw.subjectId : null);
  const submissionStatus =
    hw.submissionStatus ?? hw.mySubmission?.status ?? "pending";
  let isPastDue = hw.isPastDue;
  if (typeof isPastDue !== "boolean") {
    const deadline = hw.dueDate ? dueDeadline(hw.dueDate) : null;
    isPastDue = deadline ? Date.now() > deadline.getTime() : false;
  }
  return { ...hw, subject, submissionStatus, isPastDue };
}

// Detail — homework (correctOptionIndex stripped) + the child's submission.
export function useHomeworkDetail(id) {
  const uid = useUid();
  const studentId = useSelectedChildId();
  return useQuery({
    queryKey: ["homework", uid, studentId, "detail", id],
    queryFn: async () =>
      normalizeHomeworkDetail(
        unwrap(
          await apiClient.get(
            childPath(studentId, `homework/${encodeURIComponent(id)}`),
          ),
        ),
      ),
    enabled: !!id && !!studentId,
  });
}
