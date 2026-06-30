'use client';
import React, { useState } from 'react';
import { Modal } from '@/component/Modal';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { Paperclip, CheckCircle2, Clock, Loader2, GraduationCap } from 'lucide-react';
import { SUBMISSION_STATUS_STYLES } from './constants';

const studentName = (s) =>
  s?.student?.user?.name || s?.student?.name || s?.studentName || 'Student';
const studentRoll = (s) =>
  s?.student?.rollNumber || s?.student?.admissionNumber || s?.rollNumber || '';
const fileName = (att) => att.originalName || att.fileName || att.filename || att.name || 'File';
const fileUrl = (att) => att.url || att.path || att.location || '#';

function StatBadge({ label, value, tone }) {
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${tone}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

// One submitted row, with an inline grade form for manual types.
function SubmissionRow({ homeworkId, homework, sub, canGrade }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [marks, setMarks] = useState(sub.marksObtained ?? '');
  const [feedback, setFeedback] = useState(sub.feedback ?? '');

  const isMcq = homework.submissionType === 'mcq';
  const status = sub.status || 'submitted';

  const gradeMutation = useMutation({
    mutationFn: (payload) =>
      patchData({ url: `/homework/${homeworkId}/submissions/${sub._id}`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['homework-submissions', homeworkId] });
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success(res?.message || 'Submission graded');
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to grade'),
  });

  const submitGrade = () => {
    const hasMarks = marks !== '' && marks != null;
    if (!hasMarks && !feedback.trim()) {
      toast.error('Enter marks and/or feedback.');
      return;
    }
    if (hasMarks) {
      const n = Number(marks);
      if (Number.isNaN(n) || n < 0 || (homework.maxMarks != null && n > homework.maxMarks)) {
        toast.error(`Marks must be between 0 and ${homework.maxMarks ?? '∞'}.`);
        return;
      }
    }
    const payload = {};
    if (hasMarks) payload.marksObtained = Number(marks);
    if (feedback.trim()) payload.feedback = feedback.trim();
    gradeMutation.mutate(payload);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {studentName(sub)}
            </span>
            {studentRoll(sub) && <span className="text-xs text-gray-400">#{studentRoll(sub)}</span>}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                SUBMISSION_STATUS_STYLES[status] || SUBMISSION_STATUS_STYLES.submitted
              }`}
            >
              {status}
            </span>
            {sub.marksObtained != null && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {sub.marksObtained}/{homework.maxMarks}
              </span>
            )}
          </div>
        </div>
        {canGrade && !isMcq && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline flex-shrink-0"
          >
            {status === 'graded' ? 'Re-grade' : 'Grade'}
          </button>
        )}
      </div>

      {/* Submission content preview */}
      {sub.answerText && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line border-t border-gray-100 dark:border-gray-800 pt-2">
          {sub.answerText}
        </p>
      )}
      {sub.attachments?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-800 pt-2">
          {sub.attachments.map((att, i) => (
            <a
              key={att._id || i}
              href={fileUrl(att)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:border-teal-500 no-underline"
            >
              <Paperclip className="w-3 h-3" /> {fileName(att)}
            </a>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-2 items-start border-t border-gray-100 dark:border-gray-800 pt-3">
          <input
            type="number"
            min="0"
            max={homework.maxMarks ?? undefined}
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder={`Marks /${homework.maxMarks ?? '?'}`}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
          />
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback (optional)"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
          />
          <button
            type="button"
            onClick={submitGrade}
            disabled={gradeMutation.isPending}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {gradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SubmissionsModal({ isOpen, onClose, homework, canGrade }) {
  const { accessToken: token } = useTokenStore();
  const id = homework?._id;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['homework-submissions', id],
    queryFn: async () => {
      const res = await fetchData({ url: `/homework/${id}/submissions`, token });
      return res?.data;
    },
    enabled: !!token && !!id && isOpen,
  });

  const stats = data?.stats || {};
  const submissions = data?.submissions || [];
  const pending = data?.pending || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submissions"
      subtitle={homework?.title}
      size="lg"
    >
      {isLoading ? (
        <div className="flex flex-col items-center py-16 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="mt-3 text-sm">Loading submissions…</p>
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-sm text-red-600">
          {error?.message || 'Failed to load submissions.'}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2">
            <StatBadge
              label="Total"
              value={stats.total ?? 0}
              tone="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
            <StatBadge
              label="Submitted"
              value={stats.submitted ?? 0}
              tone="bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400"
            />
            <StatBadge
              label="Graded"
              value={stats.graded ?? 0}
              tone="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400"
            />
            <StatBadge
              label="Pending"
              value={stats.pending ?? 0}
              tone="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
            />
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Submitted ({submissions.length})
            </h3>
            {submissions.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No submissions yet.</p>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <SubmissionRow
                    key={sub._id}
                    homeworkId={id}
                    homework={homework}
                    sub={sub}
                    canGrade={canGrade}
                  />
                ))}
              </div>
            )}
          </div>

          {pending.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Not submitted ({pending.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {pending.map((st) => (
                  <span
                    key={st._id}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300"
                  >
                    <GraduationCap className="w-3 h-3 text-gray-400" />
                    {/* Pending rows carry no name — only roll/admission number. */}
                    {st.user?.name ||
                      st.name ||
                      (st.rollNumber ? `Roll ${st.rollNumber}` : st.admissionNumber || 'Student')}
                    {st.admissionNumber && st.rollNumber && (
                      <span className="text-gray-400">{st.admissionNumber}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
