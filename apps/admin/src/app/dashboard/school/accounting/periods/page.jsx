'use client';
import React, { useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import toast from 'react-hot-toast';
import ClosePeriodModal from './ClosePeriodModal';
import ConfirmModal from '../ConfirmModal';
import { formatDate } from '@/constants/accounting';

const inputWrap =
  'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none';

export default function PeriodsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canManage =
    isAdmin ||
    actions.includes('manage-accounting-period') ||
    actions.includes('manage-all-branch-accounting-period');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-accounting-period');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [closeOpen, setCloseOpen] = useState(false);
  const [reopenTarget, setReopenTarget] = useState(null);
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data } = useQuery({
    queryKey: ['accounting-periods', status, effectiveBranchId],
    queryFn: () => {
      const params = {};
      if (status) params.status = status;
      if (effectiveBranchId) params.branchId = effectiveBranchId;
      return fetchData({ url: '/ledger/period/list', page: 1, limit: 200, token, ...params });
    },
    enabled: !!token && !!user,
    placeholderData: keepPreviousData,
  });
  const periods = data?.data || [];

  const reopenMutation = useMutation({
    mutationFn: (p) =>
      postData({
        url: '/ledger/period/reopen',
        payload: { period: p.period, branchId: p.branchId?._id || p.branchId || null },
        token,
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Period reopened');
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      setReopenTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to reopen period'),
  });

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Period Locking
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Close accounting months to freeze postings after review; reopen if corrections are
              needed.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setCloseOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm self-start"
            >
              <Lock className="w-5 h-5" />
              Close Period
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputWrap}>
            <option value="">All Statuses</option>
            <option value="closed">Closed</option>
            <option value="open">Open</option>
          </select>
          {isOrgLevel && (
            <select
              value={branchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => setBranchId(e.target.value)}
              className={inputWrap}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {periods.length ? (
            periods.map((p) => {
              const closed = p.status === 'closed';
              return (
                <div key={p._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="flex items-center gap-3 flex-1">
                    {closed ? (
                      <Lock className="w-5 h-5 text-amber-600" />
                    ) : (
                      <LockOpen className="w-5 h-5 text-green-600" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {p.period}
                        {p.branchId?.name && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            {p.branchId.name}
                          </span>
                        )}
                      </div>
                      {p.note && <div className="text-xs text-gray-500">{p.note}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        closed ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {closed ? 'Closed' : 'Open'}
                    </span>
                    {closed && (
                      <span className="text-xs text-gray-400">
                        {p.closedBy?.name ? `by ${p.closedBy.name} · ` : ''}
                        {formatDate(p.closedAt)}
                      </span>
                    )}
                    {canManage && closed && (
                      <button
                        type="button"
                        onClick={() => setReopenTarget(p)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-400 border border-teal-200 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40"
                      >
                        <LockOpen className="w-4 h-4" />
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-gray-400 text-sm">
              No accounting periods recorded yet.
            </div>
          )}
        </div>

        <ClosePeriodModal
          isOpen={closeOpen}
          onClose={() => setCloseOpen(false)}
          branchId={effectiveBranchId}
          isOrgLevel={isOrgLevel}
          branches={branches}
        />
        <ConfirmModal
          isOpen={!!reopenTarget}
          onClose={() => setReopenTarget(null)}
          title="Reopen Period"
          message={
            reopenTarget
              ? `Reopen ${reopenTarget.period}? Entries dated in this month can be posted again.`
              : ''
          }
          confirmLabel="Reopen"
          confirmTone="primary"
          loading={reopenMutation.isPending}
          onConfirm={() => reopenMutation.mutate(reopenTarget)}
        />
      </div>
    </div>
  );
}
