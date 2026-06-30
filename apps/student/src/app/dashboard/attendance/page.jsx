'use client';
import { useState } from 'react';
import { CalendarCheck, X } from 'lucide-react';
import { useAttendance } from '@/hooks/useDashboard';
import { PageHeader, Panel } from '@/component/dashboard/Panel';
import { Loading, ErrorState, EmptyState } from '@/component/dashboard/States';
import AttendanceRing from '@/component/dashboard/AttendanceRing';
import { formatDate } from '@/utils/format';

// Status → badge colour. Anything unknown falls back to grey.
const STATUS_STYLES = {
  present: 'bg-[#00918e]/10 text-[#00918e]',
  absent: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  late: 'bg-[#f5b21c]/15 text-[#b07d00] dark:text-[#f5b21c]',
  leave: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  halfDay: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
  'half-day': 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
  holiday: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const LEGEND = [
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'late', label: 'Late' },
  { key: 'leave', label: 'Leave' },
  { key: 'halfDay', label: 'Half day' },
  { key: 'holiday', label: 'Holiday' },
];

export default function AttendancePage() {
  // Empty month = whole academic year. A native month picker is a discrete
  // selection, so binding it straight to the query is fine (not keystroke-y).
  const [month, setMonth] = useState('');
  const { data, isLoading, isError, error, refetch, isFetching } = useAttendance(month);

  const summary = data?.summary;
  const records = data?.records ?? [];

  return (
    <div className="max-w-5xl">
      <PageHeader
        icon={CalendarCheck}
        title="Attendance"
        subtitle={month ? 'Selected month' : 'Whole academic year'}
        action={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00918e]/40"
            />
            {month && (
              <button
                onClick={() => setMonth('')}
                title="Clear filter"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <Loading label="Loading attendance…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel className="lg:col-span-1">
              <div className="flex flex-col items-center">
                <AttendanceRing percentage={summary?.presentPercentage ?? 0} />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {summary?.total ?? 0} days recorded
                </p>
              </div>
            </Panel>

            <Panel title="Summary" className="lg:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {LEGEND.map((l) => (
                  <div key={l.key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{l.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {summary?.[l.key] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title={`Records${isFetching ? ' · updating…' : ''}`} padded={false}>
              {records.length === 0 ? (
                <EmptyState
                  title="No attendance records"
                  description="There are no records for this period yet."
                  icon={CalendarCheck}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {records.map((r, i) => {
                        const status = r.status || '—';
                        return (
                          <tr key={r._id || i}>
                            <td className="px-5 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                              {formatDate(r.date, {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                  STATUS_STYLES[status] ||
                                  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                              >
                                {String(status).replace(/([A-Z])/g, ' $1')}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                              {r.remarks || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
