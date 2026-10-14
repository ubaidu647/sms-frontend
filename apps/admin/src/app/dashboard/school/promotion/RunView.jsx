'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { summarizeSections, progressPercent, unprocessedRows } from '@/utils/promotion';
import ConfirmModal from './ConfirmModal';
import {
  DECISION_COLORS,
  DECISION_LABELS,
  RUN_STATUS_COLORS,
  RUN_STATUS_LABELS,
  primaryBtn,
  secondaryBtn,
  dangerBtn,
  thCls,
  tdCls,
  formatDate,
  runCounts,
  invalidatePromotionData,
} from './promotionShared';

// A refused "complete" names enrolled students still sitting in old sections.
const looksLikeUnprocessed = (err) =>
  err?.status === 400 &&
  (unprocessedRows(err.data).length > 0 ||
    /enrol|unprocess|not been processed|with force|remain|still/i.test(err.message));

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${value >= 100 ? 'bg-green-500' : 'bg-teal-500'}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function RunView({ runId, onOpenSection, onClosed }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(null); // 'complete' | 'force' | 'reopen' | 'cancel'
  const [refusal, setRefusal] = useState(null); // { message, rows }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['promotion-run', runId],
    queryFn: () => fetchData({ url: `/promotion/runs/${runId}`, token }),
    enabled: !!token && !!runId,
  });
  const payload = data?.data;
  const run = payload?.run || payload;
  const sections = payload?.sections || run?.sections || [];
  const summary = summarizeSections(sections);
  const counts = runCounts(run);
  const status = run?.status;

  const onDone = (msg) => (res) => {
    toast.success(res?.message || msg);
    invalidatePromotionData(queryClient);
    setConfirm(null);
    setRefusal(null);
  };

  const completeMutation = useMutation({
    mutationFn: (force) =>
      postData({
        url: `/promotion/runs/${runId}/complete`,
        payload: force ? { force: true } : {},
        token,
      }),
    onSuccess: onDone('Academic year completed'),
    onError: (err, force) => {
      if (!force && looksLikeUnprocessed(err)) {
        setRefusal({ message: err.message, rows: unprocessedRows(err.data) });
        setConfirm('force');
        return;
      }
      toast.error(err.message || 'Failed to complete the year');
      setConfirm(null);
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => postData({ url: `/promotion/runs/${runId}/reopen`, token }),
    onSuccess: onDone('Run reopened'),
    onError: (err) => {
      toast.error(err.message || 'Failed to reopen');
      setConfirm(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => postData({ url: `/promotion/runs/${runId}/cancel`, token }),
    onSuccess: (res) => {
      onDone('Run cancelled')(res);
      onClosed?.();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to cancel the run');
      setConfirm(null);
    },
  });

  const busy = completeMutation.isPending || reopenMutation.isPending || cancelMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (isError || !run) {
    return (
      <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
        {error?.message || 'Could not load the promotion run.'}
      </div>
    );
  }

  const overall = progressPercent(summary.processed, summary.students);

  return (
    <div className="space-y-4">
      {/* Run header */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {run.fromYear}
            </span>
            <ArrowRight className="w-5 h-5 text-teal-600" />
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {run.toYear}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${RUN_STATUS_COLORS[status] || RUN_STATUS_COLORS.undone}`}
            >
              {RUN_STATUS_LABELS[status] || status}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Fee increase {Number(run.feeIncreasePercent) || 0}% · prepared{' '}
              {formatDate(run.preparedAt || run.createdAt)}
              {run.completedAt ? ` · completed ${formatDate(run.completedAt)}` : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {status === 'prepared' && (
              <>
                <button
                  type="button"
                  className={dangerBtn}
                  disabled={busy || counts.processed > 0 || summary.processed > 0}
                  title={
                    counts.processed > 0 || summary.processed > 0
                      ? 'Undo every processed student first'
                      : undefined
                  }
                  onClick={() => setConfirm('cancel')}
                >
                  Cancel run
                </button>
                <button
                  type="button"
                  className={primaryBtn}
                  disabled={busy}
                  onClick={() => setConfirm('complete')}
                >
                  {completeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Complete year
                </button>
              </>
            )}
            {status === 'completed' && (
              <button
                type="button"
                className={secondaryBtn}
                disabled={busy}
                onClick={() => setConfirm('reopen')}
              >
                {reopenMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Reopen
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {summary.processed} of {summary.students} students processed · {summary.sectionsDone}/
              {summary.sectionsTotal} sections done
            </span>
            <span>{overall}%</span>
          </div>
          <ProgressBar value={overall} />
        </div>

        <div className="flex flex-wrap gap-2">
          {['promote', 'detain', 'left', 'passout'].map((d) => (
            <span key={d} className={`text-xs px-2 py-0.5 rounded-full ${DECISION_COLORS[d]}`}>
              {DECISION_LABELS[d]}: {counts[d]}
            </span>
          ))}
        </div>

        {status === 'completed' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {run.fromYear} classes and sections are now inactive (still viewable). Reopen to
            reactivate them.
          </p>
        )}
        {status === 'undone' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This run was cancelled. The {run.toYear} classes it created are kept and will be reused.
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className={thCls}>Class</th>
              <th className={thCls}>Section</th>
              <th className={thCls}>Students</th>
              <th className={`${thCls} w-64`}>Processed</th>
              <th className={thCls} />
            </tr>
          </thead>
          <tbody>
            {sections.length === 0 && (
              <tr>
                <td colSpan={5} className={`${tdCls} text-center text-gray-500 py-8`}>
                  No sections in {run.fromYear}.
                </td>
              </tr>
            )}
            {sections.map((s) => {
              const pct = progressPercent(s.processed, s.students);
              return (
                <tr
                  key={s.fromSection?._id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => onOpenSection(s.fromSection?._id)}
                >
                  <td className={tdCls}>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {s.fromClass?.name}
                    </div>
                    <div className="text-xs text-gray-400">Grade {s.fromClass?.grade}</div>
                  </td>
                  <td className={tdCls}>{s.fromSection?.name}</td>
                  <td className={tdCls}>{s.students ?? 0}</td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={pct} />
                      <span className="text-xs whitespace-nowrap">
                        {s.processed ?? 0}/{s.students ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 text-sm font-medium">
                      Open <ChevronRight className="w-4 h-4" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={confirm === 'complete'}
        onClose={() => !busy && setConfirm(null)}
        title={`Complete ${run.fromYear}?`}
        confirmLabel="Complete year"
        loading={completeMutation.isPending}
        onConfirm={() => completeMutation.mutate(false)}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          All {run.fromYear} classes and sections of this branch will be marked inactive. Their data
          stays viewable, and you can reopen the run later to reactivate them.
        </p>
        {summary.remaining > 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
            {summary.remaining} student{summary.remaining === 1 ? ' has' : 's have'} not been
            processed yet.
          </p>
        )}
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirm === 'force'}
        onClose={() => !busy && setConfirm(null)}
        title="Students still unprocessed"
        confirmLabel="Complete anyway"
        confirmTone="danger"
        loading={completeMutation.isPending}
        onConfirm={() => completeMutation.mutate(true)}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          {refusal?.message ||
            'Some enrolled students are still in a section of the year being closed.'}
        </p>
        {refusal?.rows?.length > 0 && (
          <ul className="mb-3 divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {refusal.rows.map((r, i) => (
              <li key={i} className="flex justify-between px-3 py-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">{r.label}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{r.count}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-red-700 dark:text-red-400">
          Completing anyway leaves these students in inactive {run.fromYear} sections.
        </p>
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirm === 'reopen'}
        onClose={() => !busy && setConfirm(null)}
        title={`Reopen ${run.fromYear}?`}
        message={`The ${run.fromYear} classes and sections become active again and the run goes back to in progress.`}
        confirmLabel="Reopen"
        confirmTone="warning"
        loading={reopenMutation.isPending}
        onConfirm={() => reopenMutation.mutate()}
      />

      <ConfirmModal
        isOpen={confirm === 'cancel'}
        onClose={() => !busy && setConfirm(null)}
        title="Cancel this run?"
        message={`The run is marked cancelled. The ${run.toYear} classes, sections, subjects and fee structures it created are kept and will be reused by a new run.`}
        confirmLabel="Cancel run"
        cancelLabel="Keep"
        confirmTone="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />
    </div>
  );
}
