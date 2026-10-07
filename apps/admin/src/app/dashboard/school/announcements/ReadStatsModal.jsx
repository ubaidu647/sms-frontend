'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useInfiniteQuery } from '@tanstack/react-query';
import QueryErrorState from '@/component/QueryErrorState';
import { retryUnless4xx } from '@/utils/queryError';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { formatDateTime } from '@/constants/announcement';

// The reader list is paged on the backend; the counts cover every reader.
const READS_PAGE_SIZE = 500;

export default function ReadStatsModal({ isOpen, onClose, announcement }) {
  const { accessToken: token } = useTokenStore();
  const id = announcement?._id;

  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['announcement-stats', id],
      initialPageParam: 1,
      queryFn: async ({ pageParam }) =>
        (
          await apiClient.get(`/announcement/${id}/read-stats`, {
            params: { page: pageParam, limit: READS_PAGE_SIZE },
          })
        ).data,
      getNextPageParam: (last, allPages) => {
        const total = last?.data?.totalReads ?? 0;
        const loaded = allPages.reduce((n, p) => n + (p?.data?.reads?.length || 0), 0);
        return loaded < total && last?.data?.reads?.length ? allPages.length + 1 : undefined;
      },
      enabled: !!token && isOpen && !!id,
      retry: retryUnless4xx,
    });

  const pages = data?.pages || [];
  // Counts come from the newest page; readers are every page loaded so far.
  const stats = pages[pages.length - 1]?.data;
  const reads = pages.flatMap((p) => p?.data?.reads || []);
  const totalReads = stats?.totalReads ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Read Stats"
      subtitle={announcement?.title}
      size="lg"
    >
      {isError ? (
        <QueryErrorState error={error} fallback="Could not load read stats" />
      ) : isLoading || !stats ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Reads
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats.totalReads ?? 0}
              </div>
            </div>
            {stats.requiresAck && (
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-4">
                <div className="text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                  Acknowledged
                </div>
                <div className="text-3xl font-bold text-indigo-900 mt-1">
                  {stats.ackCount ?? 0}
                  <span className="text-sm font-normal text-indigo-700 dark:text-indigo-400 ml-2">
                    / {stats.totalReads ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              Readers
            </h4>
            {reads.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nobody has read this yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Read At</th>
                      {stats.requiresAck && <th className="px-3 py-2 text-center">Ack</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {reads.map((r) => (
                      <tr
                        key={r._id || r.userId}
                        className="border-t border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                          {r.user?.name || '—'}
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-700 dark:text-gray-300">
                          {r.user?.type || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {formatDateTime(r.readAt)}
                        </td>
                        {stats.requiresAck && (
                          <td className="px-3 py-2 text-center">
                            {r.acknowledged ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {reads.length > 0 && totalReads > reads.length && (
              <div className="flex items-center justify-between gap-3 mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing first {reads.length} of {totalReads}
                </p>
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
