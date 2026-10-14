'use client';
// Supplier statement: GET /inventory/suppliers/:id/statement?from=&to= →
// { supplier, opening, rows:[{ date, type, ref, debit, credit, balance }], closing }.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { Modal } from '@/component/Modal';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { monthsAgoYMD, localYMD } from '@/utils/localDate';
import { formatAmount } from '@/utils/money';
import { useTokenStore } from '@/store/tokenStore';
import {
  Spinner,
  fmtDate,
  inputCls,
  labelCls,
  money,
  printSheet,
  secondaryBtn,
  tdCls,
  thCls,
} from './inventoryShared';

const TYPE_LABELS = {
  purchase: 'Purchase',
  payment: 'Payment',
  'purchase-void': 'Purchase void',
  'payment-void': 'Payment void',
};

const amt = (n) => (Number(n) ? formatAmount(n) : '');

export default function SupplierStatementModal({ supplier, onClose }) {
  const { accessToken: token } = useTokenStore();
  const [from, setFrom] = useState(monthsAgoYMD(3));
  const [to, setTo] = useState(localYMD());

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-supplier-statement', supplier?._id, from, to],
    queryFn: () =>
      fetchData({
        url: `/inventory/suppliers/${supplier._id}/statement`,
        token,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
    enabled: !!token && !!supplier?._id,
    retry: retryUnless4xx,
  });
  const st = data?.data || {};
  const rows = st.rows || [];
  const name = st.supplier?.name || supplier?.name || '';

  const print = () =>
    printSheet({
      title: `Supplier statement — ${name}`,
      subtitle: [
        `Period: ${from || '…'} to ${to || '…'}`,
        `Opening balance: Rs ${formatAmount(st.opening)}`,
      ],
      headers: ['Date', 'Type', 'Ref', 'Debit (paid)', 'Credit (owed)', 'Balance'],
      rows: rows.map((r) => [
        fmtDate(r.date),
        TYPE_LABELS[r.type] || r.type,
        r.ref || '',
        amt(r.debit),
        amt(r.credit),
        formatAmount(r.balance),
      ]),
      footer: `Closing balance: Rs ${formatAmount(st.closing)}`,
    });

  return (
    <Modal
      isOpen={!!supplier}
      onClose={onClose}
      title="Supplier statement"
      subtitle={name}
      size="lg"
      footer={
        <button type="button" className={secondaryBtn} onClick={print} disabled={isLoading}>
          <Printer className="w-4 h-4" />
          Print
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelCls}>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      {error ? (
        <QueryErrorState error={error} fallback="Could not load the statement" />
      ) : isLoading ? (
        <div className="py-10 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className={thCls}>Date</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Ref</th>
                <th className={`${thCls} text-right`}>Debit</th>
                <th className={`${thCls} text-right`}>Credit</th>
                <th className={`${thCls} text-right`}>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <td className={tdCls} colSpan={5}>
                  Opening balance
                </td>
                <td className={`${tdCls} text-right font-semibold`}>{money(st.opening)}</td>
              </tr>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className={tdCls}>{fmtDate(r.date)}</td>
                  <td className={tdCls}>{TYPE_LABELS[r.type] || r.type}</td>
                  <td className={`${tdCls} font-mono`}>{r.ref || '—'}</td>
                  <td className={`${tdCls} text-right`}>{amt(r.debit)}</td>
                  <td className={`${tdCls} text-right`}>{amt(r.credit)}</td>
                  <td className={`${tdCls} text-right`}>{formatAmount(r.balance)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <td className={`${tdCls} font-semibold`} colSpan={5}>
                  Closing balance
                </td>
                <td className={`${tdCls} text-right font-bold`}>{money(st.closing)}</td>
              </tr>
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              No transactions in this period.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
