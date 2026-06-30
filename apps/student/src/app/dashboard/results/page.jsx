'use client';
import { BarChart3 } from 'lucide-react';
import { useResults } from '@/hooks/useDashboard';
import { PageHeader, Panel } from '@/component/dashboard/Panel';
import { Loading, ErrorState, EmptyState } from '@/component/dashboard/States';
import { formatDate } from '@/utils/format';

export default function ResultsPage() {
  const { data, isLoading, isError, error, refetch } = useResults();
  const results = data ?? [];

  // Backend returns a flat array newest-first; group it by exam for display
  // while preserving that order.
  const groups = [];
  const index = {};
  for (const r of results) {
    const exam = r.examId || {};
    const key = exam._id || exam.name || 'unknown';
    if (!(key in index)) {
      index[key] = groups.length;
      groups.push({ exam, rows: [] });
    }
    groups[index[key]].rows.push(r);
  }

  return (
    <div className="max-w-5xl">
      <PageHeader icon={BarChart3} title="Results" subtitle="Your exam grades and scores" />

      {isLoading ? (
        <Loading label="Loading results…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No results yet"
          description="Your exam results will appear here once published."
          icon={BarChart3}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g, gi) => (
            <Panel
              key={g.exam._id || gi}
              title={g.exam.name || 'Exam'}
              padded={false}
              action={
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {g.exam.type && <span className="capitalize">{g.exam.type}</span>}
                  {g.exam.startDate && <span>· {formatDate(g.exam.startDate)}</span>}
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-5 py-3 font-medium">Subject</th>
                      <th className="px-5 py-3 font-medium">Marks</th>
                      <th className="px-5 py-3 font-medium">%</th>
                      <th className="px-5 py-3 font-medium">Grade</th>
                      <th className="px-5 py-3 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {g.rows.map((r, i) => (
                      <tr key={r._id || i}>
                        <td className="px-5 py-3 text-gray-800 dark:text-gray-100 font-medium">
                          {r.subjectId?.name || '—'}
                          {r.remarks && (
                            <span className="block text-xs font-normal text-gray-400">
                              {r.remarks}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-700 dark:text-gray-200">
                          {r.isAbsent ? '—' : (r.totalObtained ?? '—')}
                        </td>
                        <td className="px-5 py-3 text-gray-700 dark:text-gray-200">
                          {r.isAbsent || r.percentage == null
                            ? '—'
                            : `${Math.round(r.percentage)}%`}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100">
                          {r.isAbsent ? '—' : (r.grade || '—')}
                        </td>
                        <td className="px-5 py-3">
                          <ResultBadge isAbsent={r.isAbsent} isPassed={r.isPassed} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultBadge({ isAbsent, isPassed }) {
  if (isAbsent) {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        Absent
      </span>
    );
  }
  return isPassed ? (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#00918e]/10 text-[#00918e]">
      Passed
    </span>
  ) : (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
      Failed
    </span>
  );
}
