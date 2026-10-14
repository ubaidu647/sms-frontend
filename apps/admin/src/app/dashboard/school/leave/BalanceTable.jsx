'use client';
// Leave balance table — shape of GET /leave/balance and /leave/my/balance:
// { leaveYear, staffType, rows: [{ leaveType, quota, used, pending, remaining }] }
import React from 'react';
import { thCls, tdCls, leaveTypeLabel } from './leaveShared';

export default function BalanceTable({ balance }) {
  const rows = balance?.rows || [];
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
      {(balance?.leaveYear || balance?.staffType) && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
          {balance?.leaveYear && (
            <span>
              Leave year:{' '}
              <strong className="text-gray-900 dark:text-gray-100">{balance.leaveYear}</strong>
            </span>
          )}
          {balance?.staffType && (
            <span>
              Staff type:{' '}
              <strong className="text-gray-900 dark:text-gray-100 capitalize">
                {balance.staffType}
              </strong>
            </span>
          )}
        </div>
      )}
      <table className="w-full min-w-[480px]">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className={thCls}>Leave type</th>
            <th className={thCls}>Quota</th>
            <th className={thCls}>Used</th>
            <th className={thCls}>Pending</th>
            <th className={thCls}>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                No balance data.
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const unpaid = r.leaveType === 'unpaid';
              return (
                <tr
                  key={r.leaveType}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  <td className={`${tdCls} font-medium`}>{leaveTypeLabel(r.leaveType)}</td>
                  <td className={tdCls}>{unpaid ? '—' : (r.quota ?? 0)}</td>
                  <td className={tdCls}>{r.used ?? 0}</td>
                  <td className={tdCls}>{r.pending ?? 0}</td>
                  <td className={tdCls}>
                    {unpaid ? (
                      '—'
                    ) : (
                      <span
                        className={`font-semibold ${
                          Number(r.remaining) > 0
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {r.remaining ?? 0}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
        Days beyond the quota are unpaid (deducted through payroll). Only working days count.
      </p>
    </div>
  );
}
