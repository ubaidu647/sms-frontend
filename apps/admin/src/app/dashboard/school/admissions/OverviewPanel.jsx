'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, AlertTriangle, ClipboardCheck, Users } from 'lucide-react';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { currentAcademicYear, nextAcademicYear, previousAcademicYear } from '@/utils/academicYear';
import {
  ENQUIRY_STATUSES,
  SOURCES,
  STATUS_COLORS,
  sourceLabel,
  statusLabel,
  sumCounts,
} from '@/utils/admission';
import { BranchSelect, Spinner, cardCls, inputCls, labelCls } from './admissionShared';

export const yearOptions = () => {
  const cur = currentAcademicYear();
  return [previousAcademicYear(cur), cur, nextAcademicYear(cur)];
};

function StatCard({ icon: Icon, label, value, tone = 'text-teal-600' }) {
  return (
    <div className={`${cardCls} flex items-center gap-4`}>
      <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-5 h-5 ${tone}`} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? 0}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  );
}

export default function OverviewPanel({ orgTier }) {
  const { accessToken: token } = useTokenStore();
  const [branchId, setBranchId] = useState('');
  const [year, setYear] = useState(currentAcademicYear());

  const { data, isLoading, error } = useQuery({
    queryKey: ['admission-summary', branchId, year],
    queryFn: () =>
      fetchData({
        url: '/admission/enquiries/summary',
        token,
        ...(branchId ? { branchId } : {}),
        ...(year ? { academicYear: year } : {}),
      }),
    enabled: !!token,
  });
  const s = data?.data || {};
  const byStatus = s.byStatus || {};
  const bySource = s.bySource || {};
  const total = sumCounts(byStatus);

  return (
    <div className="space-y-4">
      <div className={`${cardCls} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
        {orgTier && (
          <div>
            <label className={labelCls}>Branch</label>
            <BranchSelect value={branchId} onChange={setBranchId} allLabel="All branches" />
          </div>
        )}
        <div>
          <label className={labelCls}>Academic year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)} className={inputCls}>
            <option value="">All years</option>
            {yearOptions().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load the admissions summary" />
      ) : isLoading ? (
        <div className={cardCls}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Total enquiries" value={total} />
            <StatCard
              icon={CalendarClock}
              label="Follow-ups due today"
              value={s.followUpsDueToday}
              tone="text-amber-600"
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue follow-ups"
              value={s.overdueFollowUps}
              tone="text-red-600"
            />
            <StatCard
              icon={ClipboardCheck}
              label="Tests today"
              value={s.testsToday}
              tone="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={cardCls}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                By status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ENQUIRY_STATUSES.map((st) => (
                  <div
                    key={st}
                    className={`rounded-lg px-3 py-2 ${STATUS_COLORS[st] || ''} flex items-center justify-between`}
                  >
                    <span className="text-xs font-semibold">{statusLabel(st)}</span>
                    <span className="text-lg font-bold">{byStatus[st] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={cardCls}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                By source
              </h3>
              <ul className="space-y-2">
                {SOURCES.map((src) => {
                  const n = Number(bySource[src]) || 0;
                  const total2 = sumCounts(bySource) || 1;
                  return (
                    <li key={src}>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                        <span>{sourceLabel(src)}</span>
                        <span className="font-semibold">{n}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-teal-500"
                          style={{ width: `${Math.round((n / total2) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
