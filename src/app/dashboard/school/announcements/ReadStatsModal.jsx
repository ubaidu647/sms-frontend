'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { formatDateTime } from '@/constants/announcement';

export default function ReadStatsModal({ isOpen, onClose, announcement }) {
  const { accessToken: token } = useTokenStore();
  const id = announcement?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['announcement-stats', id],
    queryFn: async () => (await apiClient.get(`/announcement/${id}/read-stats`)).data,
    enabled: !!token && isOpen && !!id,
  });

  const stats = data?.data;
  const reads = stats?.reads || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Read Stats"
      subtitle={announcement?.title}
      size="lg"
    >
      {isLoading || !stats ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Reads
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
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
          </div>
        </div>
      )}
    </Modal>
  );
}
