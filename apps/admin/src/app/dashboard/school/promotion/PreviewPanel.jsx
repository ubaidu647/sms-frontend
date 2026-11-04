'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import ConfirmModal from './ConfirmModal';
import { inputCls, primaryBtn, thCls, tdCls, invalidatePromotionData } from './promotionShared';
import WarningsNotice from './WarningsNotice';
import { warningsOf } from '@/utils/promotion';

const parsePercent = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};

export default function PreviewPanel({ branchId, fromYear, onPrepared }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [feeIncrease, setFeeIncrease] = useState('0');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['promotion-preview', branchId, fromYear],
    queryFn: () => fetchData({ url: '/promotion/preview', branchId, fromYear, token }),
    enabled: !!token && !!branchId && !!fromYear,
    retry: false,
  });
  const preview = data?.data;
  const classes = preview?.classes || [];
  const warnings = warningsOf(data);

  const percent = parsePercent(feeIncrease);
  const percentInvalid = percent === null;

  const newClasses = classes.filter((c) => !c.toClassExists).length;
  const sectionCount = classes.reduce((n, c) => n + (c.sections?.length || 0), 0);
  const subjectCount = classes.reduce((n, c) => n + (Number(c.subjects) || 0), 0);
  const feeCount = classes.filter((c) => c.feeStructure).length;

  const prepareMutation = useMutation({
    mutationFn: () =>
      postData({
        url: '/promotion/prepare',
        payload: { branchId, fromYear, feeIncreasePercent: percent || 0 },
        token,
      }),
    onSuccess: (res) => {
      toast.success(res?.message || `Year ${preview?.toYear || ''} prepared`);
      invalidatePromotionData(queryClient);
      setConfirmOpen(false);
      const run = res?.data?.run || res?.data;
      if (run?._id) onPrepared?.(run._id);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to prepare next year');
      setConfirmOpen(false);
      if (err.status === 409) invalidatePromotionData(queryClient);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
        {error?.message || 'Could not load the preview.'}
      </div>
    );
  }
  if (!preview) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        <span>{preview.fromYear}</span>
        <ArrowRight className="w-5 h-5 text-teal-600" />
        <span>{preview.toYear}</span>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          — preview of what will be prepared
        </span>
      </div>

      <WarningsNotice warnings={warnings} />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className={thCls}>Class ({preview.fromYear})</th>
              <th className={thCls}>Next grade ({preview.toYear})</th>
              <th className={thCls}>Sections</th>
              <th className={thCls}>Subjects</th>
              <th className={thCls}>Fee structure</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr>
                <td colSpan={5} className={`${tdCls} text-center text-gray-500 py-8`}>
                  No active classes found for {preview.fromYear}.
                </td>
              </tr>
            )}
            {classes.map((c) => {
              const isLast = String(c.fromClass?.grade) === String(preview.lastGrade);
              return (
                <tr
                  key={c.fromClass?._id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  <td className={tdCls}>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {c.fromClass?.name}
                    </div>
                    <div className="text-xs text-gray-400">Grade {c.fromClass?.grade}</div>
                  </td>
                  <td className={tdCls}>
                    {isLast || !c.toGrade ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                        Last grade — pass out
                      </span>
                    ) : (
                      <div>
                        <div>Grade {c.toGrade}</div>
                        <div
                          className={`text-xs ${c.toClassExists ? 'text-gray-400' : 'text-teal-600 dark:text-teal-400'}`}
                        >
                          {c.toClassExists ? 'Class already exists' : 'Will be created'}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-wrap gap-1">
                      {(c.sections || []).map((s) => (
                        <span
                          key={s.name}
                          className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800"
                          title="Current strength / capacity"
                        >
                          {s.name} · {s.strength ?? 0}/{s.capacity ?? '—'}
                        </span>
                      ))}
                      {!c.sections?.length && <span className="text-xs text-gray-400">None</span>}
                    </div>
                  </td>
                  <td className={tdCls}>{c.subjects ?? 0}</td>
                  <td className={tdCls}>
                    {c.feeStructure ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Fee increase for {preview.toYear} (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={feeIncrease}
            onChange={(e) => setFeeIncrease(e.target.value)}
            className={`${inputCls} w-full sm:w-40 ${percentInvalid ? 'border-red-400' : ''}`}
          />
          {percentInvalid && (
            <span className="text-xs text-red-600">Enter a value between 0 and 100</span>
          )}
        </label>
        <div className="flex-1 text-xs text-gray-500 dark:text-gray-400">
          Fee structures are copied with amounts × (1 + %/100), rounded to the nearest rupee.
        </div>
        <button
          type="button"
          className={primaryBtn}
          disabled={percentInvalid || classes.length === 0 || prepareMutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {prepareMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Prepare next year
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => !prepareMutation.isPending && setConfirmOpen(false)}
        title={`Prepare ${preview.toYear}?`}
        confirmLabel="Prepare"
        loading={prepareMutation.isPending}
        onConfirm={() => prepareMutation.mutate()}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          This starts the promotion run for {preview.fromYear} → {preview.toYear} and creates the
          new year&apos;s structure (anything that already exists is reused, not duplicated):
        </p>
        <ul className="list-disc ps-6 space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>
            Classes for {preview.toYear} with the same names, capacity and class teacher (
            {newClasses} new)
          </li>
          <li>{sectionCount} sections with the same names, capacity and class teacher</li>
          <li>{subjectCount} subjects and the current teaching assignments</li>
          <li>
            {feeCount} fee structure{feeCount === 1 ? '' : 's'}
            {percent ? ` with a ${percent}% increase` : ' at the same amounts'}
          </li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          No student is moved yet — you decide per section in the next step. Transport assignments
          are carried over as each student is promoted.
        </p>
      </ConfirmModal>
    </div>
  );
}
