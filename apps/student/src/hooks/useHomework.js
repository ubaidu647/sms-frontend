import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useUserStore } from '@/store/userStore';

// Student homework endpoints (auto-scoped to the logged-in student by the
// backend). List/detail are GET; submit is a mutation. Responses are the
// standard { status, message, data, total? } envelope.

const unwrap = (res) => res.data?.data;

// Cached data is per student: the signed-in user's id is part of every query
// key, so a different student on the same browser never reads this one's cache.
const useUid = () => useUserStore((s) => s.user?._id || s.user?.id || null);

// 4.1 My homework (paginated). Returns the page array plus the full count so
// the page can render a pager. Items carry submissionStatus + mySubmission.
export function useHomeworkList({ page = 1, limit = 20 } = {}) {
  const uid = useUid();
  return useQuery({
    queryKey: ['homework', uid, 'list', page, limit],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/student/homework', {
        params: { page, limit },
      });
      return { items: res.data?.data || [], total: res.data?.total || 0 };
    },
    placeholderData: keepPreviousData,
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
    hw.subject ?? (hw.subjectId && typeof hw.subjectId === 'object' ? hw.subjectId : null);
  const submissionStatus = hw.submissionStatus ?? hw.mySubmission?.status ?? 'pending';
  let isPastDue = hw.isPastDue;
  if (typeof isPastDue !== 'boolean') {
    const deadline = hw.dueDate ? dueDeadline(hw.dueDate) : null;
    isPastDue = deadline ? Date.now() > deadline.getTime() : false;
  }
  return { ...hw, subject, submissionStatus, isPastDue };
}

// 4.2 Detail — homework (correctOptionIndex stripped) + mySubmission, normalized.
export function useHomeworkDetail(id) {
  const uid = useUid();
  return useQuery({
    queryKey: ['homework', uid, 'detail', id],
    queryFn: async () =>
      normalizeHomeworkDetail(unwrap(await apiClient.get(`/dashboard/student/homework/${id}`))),
    enabled: !!id,
  });
}

// 4.3 Submit. Caller passes the already-built body keyed by type:
//   document → FormData (files in `attachments`)
//   written  → { answerText }
//   mcq      → { answers: [{ questionIndex, selectedOptionIndex }] }
// MCQ auto-grades and returns the graded submission immediately.
export function useSubmitHomework(id) {
  const queryClient = useQueryClient();
  const uid = useUid();
  return useMutation({
    mutationFn: async (body) => {
      const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
      const res = await apiClient.post(`/dashboard/student/homework/${id}/submit`, body, {
        headers: isForm ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return res.data?.data;
    },
    onSuccess: (submission) => {
      // Reflect the new submission on the cached detail so the page flips out
      // of the submit form without a round-trip; refetch the list so the badge
      // updates. status here is submitted | late | graded.
      queryClient.setQueryData(['homework', uid, 'detail', id], (prev) =>
        prev
          ? {
              ...prev,
              mySubmission: submission,
              submissionStatus: submission?.status ?? prev.submissionStatus,
            }
          : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['homework', uid, 'list'] });
    },
  });
}
