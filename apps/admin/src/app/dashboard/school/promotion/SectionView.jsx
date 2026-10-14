'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import {
  allowedDecisions,
  buildDefaultPlan,
  countDecisions,
  defaultDecision,
  isProcessed,
  missingTargets,
  plannedLoad,
  remainingRoom,
  setDecisions,
  targetKind,
  toApplyPayload,
} from '@/utils/promotion';
import ConfirmModal from './ConfirmModal';
import {
  DECISION_COLORS,
  DECISION_LABELS,
  inputCls,
  primaryBtn,
  secondaryBtn,
  dangerBtn,
  thCls,
  tdCls,
  invalidatePromotionData,
} from './promotionShared';

const targetLabel = (t, planned) => {
  const strength = (Number(t.currentStrength) || 0) + planned;
  const full = remainingRoom(t, planned) < 0 ? ' — over capacity' : '';
  return `${t.className ? `${t.className} – ` : ''}${t.name} (${strength}/${t.capacity ?? '—'})${full}`;
};

export default function SectionView({ runId, sectionId, runStatus }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState({});
  const [selected, setSelected] = useState(() => new Set());
  const [bulkDecision, setBulkDecision] = useState('');
  const [applyError, setApplyError] = useState('');
  const [confirm, setConfirm] = useState(null); // { kind: 'apply' | 'undo-section' | 'undo-one', ... }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['promotion-section', runId, sectionId],
    queryFn: () => fetchData({ url: `/promotion/runs/${runId}/sections/${sectionId}`, token }),
    enabled: !!token && !!runId && !!sectionId,
  });
  const detail = data?.data;
  const students = useMemo(() => detail?.students || [], [detail]);
  const targets = useMemo(() => detail?.targets || { promote: [], detain: [] }, [detail]);
  const isLastGrade = !!detail?.isLastGrade;
  const fromSectionName = detail?.fromSection?.name || '';
  const ctx = { targets, fromSectionName };

  const pendingIds = useMemo(
    () => students.filter((s) => !isProcessed(s)).map((s) => s._id),
    [students],
  );
  const processedCount = students.length - pendingIds.length;

  // (Re)build the plan whenever the roster changes; keep choices already made
  // for students that are still pending.
  useEffect(() => {
    if (!detail) return;
    const defaults = buildDefaultPlan({ students, targets, fromSectionName, isLastGrade });
    setPlan((prev) => {
      const next = {};
      for (const id of Object.keys(defaults)) next[id] = prev[id] || defaults[id];
      return next;
    });
    setSelected((prev) => new Set([...prev].filter((id) => defaults[id])));
  }, [detail, students, targets, fromSectionName, isLastGrade]);

  const load = useMemo(() => plannedLoad(plan), [plan]);
  const applyIds = selected.size > 0 ? [...selected] : pendingIds;
  const applyCounts = countDecisions(plan, applyIds);
  const readOnly = runStatus === 'undone';

  const onMutationError = (fallback) => (err) => {
    const msg = err.message || fallback;
    setApplyError(msg);
    toast.error(msg);
    setConfirm(null);
    if (err.status === 409) invalidatePromotionData(queryClient);
  };

  const applyMutation = useMutation({
    mutationFn: (ids) =>
      postData({
        url: `/promotion/runs/${runId}/sections/${sectionId}/apply`,
        payload: { students: toApplyPayload(plan, ids) },
        token,
      }),
    onSuccess: (res) => {
      const n = res?.data?.processed;
      toast.success(res?.message || `${n ?? ''} student${n === 1 ? '' : 's'} processed`);
      setApplyError('');
      setSelected(new Set());
      setConfirm(null);
      invalidatePromotionData(queryClient);
    },
    onError: onMutationError('Failed to apply'),
  });

  const undoMutation = useMutation({
    mutationFn: (studentIds) =>
      postData({
        url: `/promotion/runs/${runId}/sections/${sectionId}/undo`,
        payload: studentIds ? { studentIds } : {},
        token,
      }),
    onSuccess: (res) => {
      const n = res?.data?.undone;
      toast.success(res?.message || `${n ?? ''} student${n === 1 ? '' : 's'} restored`);
      setApplyError('');
      setConfirm(null);
      invalidatePromotionData(queryClient);
    },
    onError: onMutationError('Failed to undo'),
  });

  const busy = applyMutation.isPending || undoMutation.isPending;

  const changeDecision = (id, decision) => setPlan((p) => setDecisions(p, [id], decision, ctx));
  const changeTarget = (id, toSectionId) =>
    setPlan((p) => ({ ...p, [id]: { ...p[id], toSectionId } }));
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = pendingIds.length > 0 && selected.size === pendingIds.length;

  const setAllDefault = () =>
    setPlan((p) =>
      setDecisions(p, pendingIds, isLastGrade ? 'passout' : 'promote', {
        targets,
        fromSectionName,
      }),
    );
  const setSelectedTo = () => {
    if (!bulkDecision || selected.size === 0) return;
    setPlan((p) => setDecisions(p, [...selected], bulkDecision, ctx));
  };

  const startApply = () => {
    if (applyIds.length === 0) return;
    const missing = missingTargets(plan, applyIds);
    if (missing.length) {
      const names = students
        .filter((s) => missing.includes(s._id))
        .map((s) => s.name)
        .slice(0, 3)
        .join(', ');
      toast.error(`Choose a target section for: ${names}${missing.length > 3 ? '…' : ''}`);
      return;
    }
    setConfirm({ kind: 'apply', ids: applyIds });
  };

  const bulkOptions = useMemo(() => {
    const opts = new Set(allowedDecisions(isLastGrade));
    students.forEach((s) => allowedDecisions(isLastGrade, s).forEach((d) => opts.add(d)));
    return [...opts];
  }, [students, isLastGrade]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (isError || !detail) {
    return (
      <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
        {error?.message || 'Could not load the section.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header + targets */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {detail.fromClass?.name} – {detail.fromSection?.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Grade {detail.fromClass?.grade}
              {isLastGrade ? ' · last grade — students pass out' : ''} · {students.length} students
              · {processedCount} processed
            </div>
          </div>
          {processedCount > 0 && !readOnly && (
            <button
              type="button"
              className={dangerBtn}
              disabled={busy}
              onClick={() => setConfirm({ kind: 'undo-section' })}
            >
              <RotateCcw className="w-4 h-4" />
              Undo section
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {['promote', 'detain'].map((kind) => (
            <div key={kind}>
              <div className="font-semibold text-gray-600 dark:text-gray-300 mb-1">
                {kind === 'promote' ? 'Promote into' : 'Detain into'}
              </div>
              <div className="flex flex-wrap gap-1">
                {(targets[kind] || []).map((t) => {
                  const room = remainingRoom(t, load[t._id] || 0);
                  return (
                    <span
                      key={t._id}
                      className={`px-2 py-0.5 rounded ${room < 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                      title="Strength incl. planned / capacity"
                    >
                      {targetLabel(t, load[t._id] || 0)}
                    </span>
                  );
                })}
                {!targets[kind]?.length && (
                  <span className="text-gray-400">
                    {kind === 'promote' && isLastGrade ? 'No next grade' : 'No sections available'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {applyError && (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{applyError}</span>
          <button type="button" onClick={() => setApplyError('')} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk actions */}
      {pendingIds.length > 0 && !readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={secondaryBtn} onClick={setAllDefault} disabled={busy}>
            Set all to {isLastGrade ? 'Pass out' : 'Promote'}
          </button>
          <select
            value={bulkDecision}
            onChange={(e) => setBulkDecision(e.target.value)}
            className={inputCls}
            disabled={busy}
          >
            <option value="">Set selected to…</option>
            {bulkOptions.map((d) => (
              <option key={d} value={d}>
                {DECISION_LABELS[d]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={secondaryBtn}
            onClick={setSelectedTo}
            disabled={busy || !bulkDecision || selected.size === 0}
          >
            Apply to {selected.size} selected
          </button>
        </div>
      )}

      {/* Roster */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className={`${thCls} w-10`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={pendingIds.length === 0 || readOnly}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(pendingIds))}
                  aria-label="Select all pending students"
                />
              </th>
              <th className={`${thCls} w-16`}>Roll</th>
              <th className={thCls}>Student</th>
              <th className={`${thCls} w-44`}>Decision</th>
              <th className={thCls}>Target section</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className={`${tdCls} text-center text-gray-500 py-8`}>
                  No students in this section.
                </td>
              </tr>
            )}
            {students.map((s) => {
              const done = isProcessed(s);
              const entry = plan[s._id] || {
                decision: defaultDecision(s, isLastGrade),
                toSectionId: '',
              };
              const kind = targetKind(entry.decision);
              const options = kind ? targets[kind] || [] : [];
              return (
                <tr
                  key={s._id}
                  className={`border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${done ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''}`}
                >
                  <td className={tdCls}>
                    {!done && (
                      <input
                        type="checkbox"
                        checked={selected.has(s._id)}
                        disabled={readOnly}
                        onChange={() => toggle(s._id)}
                        aria-label={`Select ${s.name}`}
                      />
                    )}
                  </td>
                  <td className={`${tdCls} font-medium`}>{s.rollNumber ?? '—'}</td>
                  <td className={tdCls}>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                    <div className="text-xs text-gray-400">
                      {s.admissionNumber}
                      {s.academicStatus && s.academicStatus !== 'enrolled'
                        ? ` · ${s.academicStatus}`
                        : ''}
                    </div>
                  </td>
                  {done ? (
                    <>
                      <td className={tdCls}>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${DECISION_COLORS[s.record.decision] || ''}`}
                        >
                          {DECISION_LABELS[s.record.decision] || s.record.decision}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-center justify-between gap-2">
                          <span>
                            {s.record.to?.sectionName
                              ? `${s.record.to.sectionName}${s.record.to.rollNumber != null ? ` · roll ${s.record.to.rollNumber}` : ''}`
                              : '—'}
                          </span>
                          {!readOnly && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                              disabled={busy}
                              onClick={() =>
                                setConfirm({ kind: 'undo-one', id: s._id, name: s.name })
                              }
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Undo
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={tdCls}>
                        <select
                          value={entry.decision}
                          onChange={(e) => changeDecision(s._id, e.target.value)}
                          className={`${inputCls} w-full`}
                          disabled={busy || readOnly}
                        >
                          {allowedDecisions(isLastGrade, s).map((d) => (
                            <option key={d} value={d}>
                              {DECISION_LABELS[d]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={tdCls}>
                        {kind ? (
                          <select
                            value={entry.toSectionId || ''}
                            onChange={(e) => changeTarget(s._id, e.target.value)}
                            className={`${inputCls} w-full ${entry.toSectionId ? '' : 'border-red-400'}`}
                            disabled={busy || readOnly}
                          >
                            <option value="">Select section…</option>
                            {options.map((t) => (
                              <option key={t._id} value={t._id}>
                                {targetLabel(t, load[t._id] || 0)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {entry.decision === 'left'
                              ? 'Marked dropped, seat released'
                              : 'Graduated, seat released'}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Apply bar */}
      {pendingIds.length > 0 && !readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {Object.entries(applyCounts)
              .filter(([, n]) => n > 0)
              .map(([d, n]) => (
                <span key={d} className={`text-xs px-2 py-0.5 rounded-full ${DECISION_COLORS[d]}`}>
                  {DECISION_LABELS[d]}: {n}
                </span>
              ))}
          </div>
          <button type="button" className={primaryBtn} disabled={busy} onClick={startApply}>
            {applyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {selected.size > 0
              ? `Apply ${selected.size} selected`
              : `Apply all ${pendingIds.length}`}
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirm?.kind === 'apply'}
        onClose={() => !busy && setConfirm(null)}
        title={`Apply decisions for ${confirm?.ids?.length || 0} student${confirm?.ids?.length === 1 ? '' : 's'}?`}
        confirmLabel="Apply"
        loading={applyMutation.isPending}
        onConfirm={() => applyMutation.mutate(confirm.ids)}
      >
        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 mb-3">
          {Object.entries(countDecisions(plan, confirm?.ids || []))
            .filter(([, n]) => n > 0)
            .map(([d, n]) => (
              <li key={d}>
                <span className="font-semibold">{n}</span> × {DECISION_LABELS[d]}
              </li>
            ))}
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Promoted and detained students move to their new-year section with fresh roll numbers;
          their transport is carried over. Left students are marked dropped and passed-out students
          graduated. Nothing is applied if any entry fails; each student can be undone later.
        </p>
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirm?.kind === 'undo-section'}
        onClose={() => !busy && setConfirm(null)}
        title="Undo this section?"
        message={`All ${processedCount} processed students of ${fromSectionName} are restored to their old class, section, roll number and status, and their transport is restored.`}
        confirmLabel="Undo section"
        confirmTone="danger"
        loading={undoMutation.isPending}
        onConfirm={() => undoMutation.mutate(undefined)}
      />

      <ConfirmModal
        isOpen={confirm?.kind === 'undo-one'}
        onClose={() => !busy && setConfirm(null)}
        title={`Undo ${confirm?.name || 'student'}?`}
        message="The student is restored to their old class, section, roll number and status."
        confirmLabel="Undo"
        confirmTone="warning"
        loading={undoMutation.isPending}
        onConfirm={() => undoMutation.mutate([confirm.id])}
      />
    </div>
  );
}
