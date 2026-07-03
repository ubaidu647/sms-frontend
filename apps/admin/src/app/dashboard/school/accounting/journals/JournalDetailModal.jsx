'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import {
  JOURNAL_SOURCE_COLORS,
  JOURNAL_STATUS_COLORS,
  VOUCHER_TYPE_COLORS,
  VOUCHER_TYPE_LABELS,
  formatDate,
  formatLedgerAmount,
  formatMoney,
} from '@/constants/accounting';

export default function JournalDetailModal({ isOpen, onClose, journalId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['journal-detail', journalId],
    queryFn: () => fetchData({ url: `/ledger/journal/${journalId}`, token }),
    enabled: !!token && isOpen && !!journalId,
  });
  const je = data?.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={je ? `Journal ${je.serialNumber}` : 'Journal Entry'}
      subtitle={je?.narration}
      size="lg"
    >
      {isLoading || !je ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {je.voucherType && (
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                  VOUCHER_TYPE_COLORS[je.voucherType] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {VOUCHER_TYPE_LABELS[je.voucherType] || je.voucherType}
              </span>
            )}
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                JOURNAL_SOURCE_COLORS[je.source] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {je.source}
            </span>
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                JOURNAL_STATUS_COLORS[je.status] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {je.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-1.5">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-900 dark:text-gray-100">{formatDate(je.date)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-1.5">
              <span className="text-gray-500">Branch</span>
              <span className="text-gray-900 dark:text-gray-100">{je.branchId?.name || '—'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-1.5">
              <span className="text-gray-500">Created by</span>
              <span className="text-gray-900 dark:text-gray-100">
                {je.createdBy?.name || je.createdBy?.email || '—'}
              </span>
            </div>
            {je.voidReason && (
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-1.5">
                <span className="text-gray-500">Void reason</span>
                <span className="text-gray-900 dark:text-gray-100">{je.voidReason}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Account</th>
                  <th className="px-3 py-2 text-right font-semibold">Debit</th>
                  <th className="px-3 py-2 text-right font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody>
                {(je.lines || []).map((l, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">
                      <div className="text-gray-900 dark:text-gray-100">
                        {l.accountId?.name
                          ? `${l.accountId.code} · ${l.accountId.name}`
                          : l.accountId}
                      </div>
                      {l.description && (
                        <div className="text-xs text-gray-400">{l.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatLedgerAmount(l.debit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatLedgerAmount(l.credit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-800 font-semibold">
                <tr>
                  <td className="px-3 py-2 text-right">Total</td>
                  <td className="px-3 py-2 text-right font-mono">{formatMoney(je.totalDebit)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatMoney(je.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
