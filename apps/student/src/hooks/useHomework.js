import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';

// Student homework endpoints (auto-scoped to the logged-in student by the
// backend). List/detail are GET; submit is a mutation. Responses are the
// standard { status, message, data, total? } envelope.

const unwrap = (res) => res.data?.data;

// 4.1 My homework (paginated). Returns the page array plus the full count so
// the page can render a pager. Items carry submissionStatus + mySubmission.
export function useHomeworkList({ page = 1, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['homework', 'list', page, limit],
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
  return useQuery({
    queryKey: ['homework', 'detail', id],
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
      queryClient.setQueryData(['homework', 'detail', id], (prev) =>
        prev
          ? { ...prev, mySubmission: submission, submissionStatus: submission?.status }
          : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['homework', 'list'] });
    },
  });
}
