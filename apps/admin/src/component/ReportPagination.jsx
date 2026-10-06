'use client';
import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export const REPORT_PAGE_SIZES = [100, 250, 500, 1000];

/**
 * "Showing X–Y of Z" + page/limit controls for server-paged reports. `total` is
 * the full row count the server matched; `truncated` means rows exist past this
 * page. Totals in the report header always cover every row, not just this page.
 */
export default function ReportPagination({
  page,
  limit,
  shown,
  total,
  truncated,
  onPageChange,
  onLimitChange,
  noun = 'rows',
  className = '',
}) {
  const start = shown > 0 ? (page - 1) * limit + 1 : 0;
  const rawEnd = (page - 1) * limit + shown;
  const totalCount = typeof total === 'number' ? total : rawEnd + (truncated ? 1 : 0);
  // An empty page (e.g. one emptied by payments) shows "0–0", never an end past the total.
  const end = shown > 0 ? rawEnd : 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / Math.max(1, limit)));
  const hasPrev = page > 1;
  const hasNext = !!truncated || page < pageCount;
  const btn =
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className={`space-y-2 print:hidden ${className}`}>
      {truncated && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            This page doesn&apos;t include every row — {totalCount.toLocaleString()} {noun} match.
            Use Next to see the rest. Exports and prints cover this page only; totals cover all.
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span>
          Showing {start.toLocaleString()}–{end.toLocaleString()} of {totalCount.toLocaleString()}{' '}
          {noun}
        </span>
        <div className="flex items-center gap-2">
          {onLimitChange && (
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            >
              {REPORT_PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className={btn}
            disabled={!hasPrev}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span>
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            className={btn}
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
