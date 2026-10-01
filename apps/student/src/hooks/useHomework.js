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

// 4.2 Detail — same item shape (correctOptionIndex stripped) + mySubmission.
export function useHomeworkDetail(id) {
  const uid = useUid();
  return useQuery({
    queryKey: ['homework', uid, 'detail', id],
    queryFn: async () => unwrap(await apiClient.get(`/dashboard/student/homework/${id}`)),
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
              submissionStatus: submission?.status,
            }
          : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['homework', uid, 'list'] });
    },
  });
}
