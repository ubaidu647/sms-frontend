'use client';
import React from 'react';
import Link from 'next/link';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import {
  formatDate,
  formatMoney,
  PAYMENT_METHOD_COLORS,
  VOUCHER_STATUS_COLORS,
} from '@/constants/fee';

export default function PaymentDetailModal({ isOpen, onClose, paymentId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => (await apiClient.get(`/fee/payment/${paymentId}`)).data,
    enabled: !!token && isOpen && !!paymentId,
  });

  const p = data?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Detail" size="md">
      {isLoading || !p ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-5">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-widest">Receipt</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{p.receiptNumber}</div>
            <div
              className={`text-2xl font-bold mt-3 ${p.isVoid ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              {formatMoney(p.amount)}
            </div>
            <span
              className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                PAYMENT_METHOD_COLORS[p.method] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {p.method}
            </span>
            {p.isVoid && (
              <div className="mt-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Voided
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Date" value={formatDate(p.paymentDate)} />
            <Info label="Reference" value={p.referenceNumber || '—'} />
            <Info
              label="Received By"
              value={p.receivedBy?.user?.name || p.receivedBy?.name || '—'}
            />
            {p.isVoid && (
              <>
                <Info label="Voided At" value={formatDate(p.voidedAt)} />
                <Info
                  label="Voided By"
                  value={p.voidedBy?.user?.name || p.voidedBy?.name || '—'}
                />
                <Info label="Void Reason" value={p.voidReason || '—'} />
              </>
            )}
          </div>

          {p.notes && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Notes</div>
              <div className="text-sm text-gray-800">{p.notes}</div>
            </div>
          )}

          {p.voucherId && (
            <div className="border-t pt-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Voucher
              </h4>
              <div className="flex items-center justify-between">
                <Link
                  href={`/dashboard/school/fees/vouchers/${p.voucherId._id || p.voucherId}`}
                  className="text-sm font-medium text-teal-700 hover:underline"
                  onClick={onClose}
                >
                  {p.voucherId.voucherNumber || 'Open voucher →'}
                </Link>
                {p.voucherId.status && (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      VOUCHER_STATUS_COLORS[p.voucherId.status] || 'bg-gray-100'
                    }`}
                  >
                    {p.voucherId.status}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-gray-900 font-medium">{value}</div>
    </div>
  );
}
