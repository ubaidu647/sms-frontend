'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { formatMoney, MONTH_OPTIONS } from '@/constants/fee';

const monthLabel = (m) => MONTH_OPTIONS.find((x) => x.value === Number(m))?.label || '—';

export default function StructureDetailModal({ isOpen, onClose, structureId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['fee-structure', structureId],
    queryFn: async () => (await apiClient.get(`/fee/structure/${structureId}`)).data,
    enabled: !!token && isOpen && !!structureId,
  });

  const s = data?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fee Structure" subtitle={s?.name} size="lg">
      {isLoading || !s ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <Info
              label="Class"
              value={`${s.classId?.name ?? '—'}${s.classId?.grade ? ` (Gr ${s.classId.grade})` : ''}`}
            />
            <Info label="Year" value={s.academicYear} />
            <Info label="Status" value={s.isActive ? 'Active' : 'Inactive'} />
            <Info label="Default Due Day" value={s.defaultDueDay ?? '—'} />
            <Info label="Late Fee / Day" value={formatMoney(s.lateFeePerDay)} />
            <Info label="Serial #" value={s.serialNumber || '—'} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              Components
            </h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Frequency</th>
                    <th className="px-3 py-2 text-left">Billing Month</th>
                    <th className="px-3 py-2 text-center">Discount</th>
                    <th className="px-3 py-2 text-center">Optional</th>
                  </tr>
                </thead>
                <tbody>
                  {(s.components || []).map((c, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                        {c.name}
                      </td>
                      <td className="px-3 py-2 text-right">{formatMoney(c.amount)}</td>
                      <td className="px-3 py-2 capitalize">{c.frequency}</td>
                      <td className="px-3 py-2">
                        {c.frequency === 'annual' || c.frequency === 'quarterly'
                          ? monthLabel(c.billingMonth)
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {c.appliesDiscount !== false ? '✓' : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">{c.isOptional ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{value}</div>
    </div>
  );
}
