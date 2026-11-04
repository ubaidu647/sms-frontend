'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ChevronRight, Loader2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { fetchData } from '@/utils/api';
import { canEditScope, isOrgLevel } from '@/utils/permissions';
import { currentAcademicYear, nextAcademicYear, previousAcademicYear } from '@/utils/academicYear';
import PreviewPanel from './PreviewPanel';
import WarningsNotice from './WarningsNotice';
import { warningsOf } from '@/utils/promotion';
import RunView from './RunView';
import SectionView from './SectionView';
import {
  RUN_STATUS_COLORS,
  RUN_STATUS_LABELS,
  inputCls,
  primaryBtn,
  secondaryBtn,
  thCls,
  tdCls,
  formatDate,
  runCounts,
} from './promotionShared';

const YEAR_RE = /^\d{4}-\d{4}$/;

export default function PromotionPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const t = useTranslations('promotion');

  const role = user?.role;
  const canManage = canEditScope(role, 'manage-promotion');
  const orgLevel = isOrgLevel(role, 'manage-promotion');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [pickedBranchId, setPickedBranchId] = useState(userBranchId);
  const branchId = orgLevel ? pickedBranchId : userBranchId;

  const defaultYear = currentAcademicYear();
  const [draftYear, setDraftYear] = useState(defaultYear);
  const [fromYear, setFromYear] = useState(defaultYear);
  const draftYearValid = YEAR_RE.test(draftYear.trim());

  const [runId, setRunId] = useState(null);
  const [sectionId, setSectionId] = useState(null);

  const { data: branchData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && orgLevel,
    staleTime: Infinity,
  });
  const branches = useMemo(() => branchData?.data || [], [branchData]);

  // Org-tier users without a home branch start on the first branch.
  useEffect(() => {
    if (orgLevel && !pickedBranchId && branches.length) setPickedBranchId(branches[0]._id);
  }, [orgLevel, pickedBranchId, branches]);

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['promotion-runs', branchId],
    queryFn: () => fetchData({ url: '/promotion/runs', page: 1, limit: 100, branchId, token }),
    enabled: !!token && !!branchId && canManage,
  });
  const runs = runsData?.data || [];
  const runsWarnings = warningsOf(runsData);
  const openRunForYear = runs.find((r) => r.fromYear === fromYear && r.status !== 'undone');
  const currentRun = runs.find((r) => r._id === runId);

  const applyYear = () => {
    if (!draftYearValid) return;
    setFromYear(draftYear.trim());
  };

  const changeBranch = (id) => {
    setPickedBranchId(id);
    setRunId(null);
    setSectionId(null);
  };

  if (!canManage) {
    return (
      <div className="md:flex-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-3xl mx-auto text-center py-16 text-gray-600 dark:text-gray-400">
          You do not have permission to manage year-end promotion.
        </div>
      </div>
    );
  }

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        {runId && (
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => (sectionId ? setSectionId(null) : setRunId(null))}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              className="text-teal-600 dark:text-teal-400 hover:underline"
              onClick={() => {
                setRunId(null);
                setSectionId(null);
              }}
            >
              Promotion
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {sectionId ? (
              <button
                type="button"
                className="text-teal-600 dark:text-teal-400 hover:underline"
                onClick={() => setSectionId(null)}
              >
                {currentRun ? `${currentRun.fromYear} → ${currentRun.toYear}` : 'Run'}
              </button>
            ) : (
              <span className="text-gray-700 dark:text-gray-300">
                {currentRun ? `${currentRun.fromYear} → ${currentRun.toYear}` : 'Run'}
              </span>
            )}
            {sectionId && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Section</span>
              </>
            )}
          </div>
        )}

        {runId && sectionId && (
          <SectionView runId={runId} sectionId={sectionId} runStatus={currentRun?.status} />
        )}
        {runId && !sectionId && (
          <RunView
            runId={runId}
            onOpenSection={(id) => setSectionId(id)}
            onClosed={() => setRunId(null)}
          />
        )}

        {!runId && (
          <div className="space-y-6">
            {/* Step 1: branch + year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end gap-3">
              {orgLevel && (
                <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Branch</span>
                  <select
                    value={pickedBranchId}
                    onChange={(e) => changeBranch(e.target.value)}
                    className={`${inputCls} w-full lg:w-64`}
                    disabled={branchesLoading}
                  >
                    <option value="">Select branch…</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Promote from year</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draftYear}
                    placeholder="2025-2026"
                    onChange={(e) => setDraftYear(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applyYear();
                    }}
                    className={`${inputCls} w-full lg:w-36 ${draftYearValid ? '' : 'border-red-400'}`}
                  />
                  <button
                    type="button"
                    className={primaryBtn}
                    disabled={!draftYearValid}
                    onClick={applyYear}
                  >
                    <Search className="w-4 h-4" />
                    Load
                  </button>
                </div>
              </label>
              <div className="flex gap-2 text-xs">
                {[previousAcademicYear(defaultYear), defaultYear].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setDraftYear(y);
                      setFromYear(y);
                    }}
                    className={`px-2 py-1 rounded-full border ${
                      fromYear === y
                        ? 'border-teal-600 text-teal-700 dark:text-teal-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {!branchId ? (
              <div className="p-6 text-center text-sm text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                Select a branch to start.
              </div>
            ) : (
              <>
                {/* Existing runs */}
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Promotion runs
                  </h2>
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className={thCls}>Years</th>
                          <th className={thCls}>Status</th>
                          <th className={thCls}>Processed</th>
                          <th className={thCls}>Promote / Detain / Left / Pass out</th>
                          <th className={thCls}>Prepared</th>
                          <th className={thCls} />
                        </tr>
                      </thead>
                      <tbody>
                        {runsLoading && (
                          <tr>
                            <td colSpan={6} className={`${tdCls} text-center py-6`}>
                              <Loader2 className="w-5 h-5 animate-spin inline" />
                            </td>
                          </tr>
                        )}
                        {!runsLoading && runs.length === 0 && (
                          <tr>
                            <td colSpan={6} className={`${tdCls} text-center text-gray-500 py-6`}>
                              No promotion runs yet for this branch.
                            </td>
                          </tr>
                        )}
                        {runs.map((r) => {
                          const c = runCounts(r);
                          return (
                            <tr
                              key={r._id}
                              className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => setRunId(r._id)}
                            >
                              <td
                                className={`${tdCls} font-medium text-gray-900 dark:text-gray-100`}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {r.fromYear} <ArrowRight className="w-3.5 h-3.5" /> {r.toYear}
                                </span>
                              </td>
                              <td className={tdCls}>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${RUN_STATUS_COLORS[r.status] || RUN_STATUS_COLORS.undone}`}
                                >
                                  {RUN_STATUS_LABELS[r.status] || r.status}
                                </span>
                              </td>
                              <td className={tdCls}>
                                {c.processed}/{c.students}
                              </td>
                              <td className={tdCls}>
                                {c.promote} / {c.detain} / {c.left} / {c.passout}
                              </td>
                              <td className={tdCls}>{formatDate(r.preparedAt || r.createdAt)}</td>
                              <td className={`${tdCls} text-right`}>
                                <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                                  Open <ChevronRight className="w-4 h-4" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <WarningsNotice warnings={runsWarnings} />

                {/* Step 2: preview & prepare (or continue the existing run) */}
                {openRunForYear ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-900">
                    <p className="text-sm text-teal-900 dark:text-teal-200">
                      {fromYear} → {openRunForYear.toYear || nextAcademicYear(fromYear)} is already{' '}
                      {openRunForYear.status === 'completed' ? 'completed' : 'prepared'}. Continue
                      promoting students section by section.
                    </p>
                    <button
                      type="button"
                      className={primaryBtn}
                      onClick={() => setRunId(openRunForYear._id)}
                    >
                      Open run
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  !runsLoading && (
                    <PreviewPanel
                      branchId={branchId}
                      fromYear={fromYear}
                      onPrepared={(id) => setRunId(id)}
                    />
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
