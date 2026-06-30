'use client';
import React, { useRef } from 'react';
import { Modal } from '@/component/Modal';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, deleteData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { Loader2, Paperclip, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { STATUS_STYLES, SUBMISSION_TYPE_LABELS } from './constants';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = '.jpeg,.jpg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';
const fileName = (att) => att.originalName || att.fileName || att.filename || att.name || 'File';
const fileUrl = (att) => att.url || att.path || att.location || '#';

function fmt(iso, withTime) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 text-right">{children}</span>
    </div>
  );
}

export default function HomeworkDetailModal({ isOpen, onClose, homeworkId, canUpdate, fallback }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['homework-detail', homeworkId],
    queryFn: async () => {
      const res = await fetchData({ url: `/homework/${homeworkId}`, token });
      return res?.data;
    },
    enabled: !!token && !!homeworkId && isOpen,
  });

  const hw = data?.homework || data || {};
  const stats = data?.stats || {};
  const attachments = hw.attachments || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['homework-detail', homeworkId] });
    queryClient.invalidateQueries({ queryKey: ['homework'] });
  };

  const addAttachment = useMutation({
    mutationFn: (fd) =>
      postData({ url: `/homework/${homeworkId}/attachments`, payload: fd, token }),
    onSuccess: () => {
      toast.success('Attachment added');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to add attachment'),
  });

  const removeAttachment = useMutation({
    mutationFn: (attachmentId) =>
      deleteData({ url: `/homework/${homeworkId}/attachments/${attachmentId}`, token }),
    onSuccess: () => {
      toast.success('Attachment removed');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to remove attachment'),
  });

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('File is over the 5 MB limit.');
      return;
    }
    const fd = new FormData();
    fd.append('attachment', file);
    addAttachment.mutate(fd);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Homework Details"
      subtitle={hw?.title || fallback?.title}
      size="lg"
    >
      {isLoading ? (
        <div className="flex flex-col items-center py-16 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="mt-3 text-sm">Loading…</p>
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-sm text-red-600">
          {error?.message || 'Failed to load homework.'}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                STATUS_STYLES[hw.status] || STATUS_STYLES.draft
              }`}
            >
              {hw.status}
            </span>
            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {SUBMISSION_TYPE_LABELS[hw.submissionType] || hw.submissionType}
            </span>
            {hw.serialNumber && <span className="text-xs text-gray-400">{hw.serialNumber}</span>}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
            {hw.description}
          </p>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 divide-y divide-gray-100 dark:divide-gray-800">
            {/* Detail returns only IDs for these refs; fall back to the list row,
                which carries a populated subject. */}
            <Row label="Class">{hw.class?.name ?? fallback?.class?.name ?? '—'}</Row>
            <Row label="Section">{hw.section?.name ?? fallback?.section?.name ?? '—'}</Row>
            <Row label="Subject">{hw.subject?.name ?? fallback?.subject?.name ?? '—'}</Row>
            <Row label="Max Marks">{hw.maxMarks ?? '—'}</Row>
            <Row label="Assigned">{fmt(hw.assignedDate)}</Row>
            <Row label="Due">{fmt(hw.dueDate, true)}</Row>
            <Row label="Late Submission">{hw.allowLateSubmission ? 'Allowed' : 'Not allowed'}</Row>
            <Row label="Submissions">
              {stats.submissionCount ?? 0} · {stats.gradedCount ?? 0} graded
            </Row>
          </div>

          {hw.submissionType === 'mcq' && hw.questions?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                Questions ({hw.questions.length})
              </h3>
              <div className="space-y-3">
                {hw.questions.map((q, qi) => (
                  <div
                    key={qi}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 p-3"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {qi + 1}. {q.questionText}
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        ({q.marks ?? 1} mark{(q.marks ?? 1) === 1 ? '' : 's'})
                      </span>
                    </p>
                    <ul className="mt-2 space-y-1">
                      {(q.options || []).map((opt, oi) => {
                        const correct = q.correctOptionIndex === oi;
                        return (
                          <li
                            key={oi}
                            className={`flex items-center gap-2 text-sm ${
                              correct
                                ? 'text-green-700 dark:text-green-400 font-medium'
                                : 'text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {correct ? (
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <span className="w-4 h-4 flex-shrink-0" />
                            )}
                            {opt.text}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Reference Files ({attachments.length})
              </h3>
              {canUpdate && (
                <>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={addAttachment.isPending}
                    className="flex items-center gap-1 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline disabled:opacity-50"
                  >
                    {addAttachment.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Add file
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={onPickFile}
                  />
                </>
              )}
            </div>
            {attachments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No reference files.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((att, i) => (
                  <li
                    key={att._id || i}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                  >
                    <Paperclip className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <a
                      href={fileUrl(att)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200 no-underline hover:text-teal-700"
                    >
                      {fileName(att)}
                    </a>
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => removeAttachment.mutate(att._id)}
                        disabled={removeAttachment.isPending}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
