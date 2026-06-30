'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { useHomeworkList } from '@/hooks/useHomework';
import { PageHeader, Panel } from '@/component/dashboard/Panel';
import { Loading, ErrorState, EmptyState } from '@/component/dashboard/States';
import { SubmissionBadge, TypeBadge } from '@/component/dashboard/homework/badges';
import { formatDate } from '@/utils/format';

const LIMIT = 20;

export default function HomeworkPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isFetching } = useHomeworkList({
    page,
    limit: LIMIT,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="max-w-3xl">
      <PageHeader
        icon={BookOpen}
        title="Homework"
        subtitle={total ? `${total} assignment${total === 1 ? '' : 's'}` : 'Your assignments'}
      />

      {isLoading ? (
        <Loading label="Loading homework…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No homework yet"
          description="Assignments from your teachers will show up here."
          icon={BookOpen}
        />
      ) : (
        <>
          <div className={`space-y-3 ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
            {items.map((hw) => {
              const overdue = hw.isPastDue && hw.submissionStatus === 'pending';
              return (
                <Link key={hw._id} href={`/dashboard/homework/${hw._id}`} className="block no-underline">
                  <Panel className="hover:border-[#00918e] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#00918e]/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-[#00918e]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {hw.title}
                          </h3>
                          <SubmissionBadge status={hw.submissionStatus} />
                          <TypeBadge type={hw.submissionType} />
                        </div>
                        {hw.subject?.name && (
                          <p className="mt-0.5 text-xs font-medium text-[#00918e]">
                            {hw.subject.name}
                          </p>
                        )}
                        {hw.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {hw.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <span
                            className={`flex items-center gap-1 ${
                              overdue ? 'text-red-500 font-medium' : 'text-gray-400'
                            }`}
                          >
                            {overdue ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            Due {formatDate(hw.dueDate)}
                          </span>
                          {hw.submissionStatus === 'graded' && hw.mySubmission && (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {hw.mySubmission.marksObtained}/{hw.maxMarks}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
