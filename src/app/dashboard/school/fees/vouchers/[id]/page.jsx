'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Wallet,
  AlertOctagon,
  Ban,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import {
  formatDate,
  formatMoney,
  formatMonth,
  PAYMENT_METHOD_COLORS,
  VOUCHER_STATUS_COLORS,
} from '@/constants/fee';
import VoidVoucherModal from '../VoidVoucherModal';
import LateFeeModal from '../LateFeeModal';
import RegenerateVoucherModal from '../RegenerateVoucherModal';
import RecordPaymentModal from '../../payments/RecordPaymentModal';
import VoidPaymentModal from '../../payments/VoidPaymentModal';

export default function VoucherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const voucherId = params?.id;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const [voidVoucherOpen, setVoidVoucherOpen] = useState(false);
  const [lateFeeOpen, setLateFeeOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [voidPaymentTarget, setVoidPaymentTarget] = useState(null);

  const isOwnOnly = resolveScope(user?.role, 'view-fee') === 'own';
  const canRecordPayment =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['record-payment', 'record-all-branch-payment']);
  const canUpdate =
    !isOwnOnly && hasAnyAction(user?.role, ['update-fee', 'update-all-branch-fee']);
  const canDelete =
    !isOwnOnly && hasAnyAction(user?.role, ['delete-fee', 'delete-all-branch-fee']);
  const canRegenerate =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['generate-voucher', 'generate-all-branch-voucher']);
  const canVoidPayment =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['void-payment', 'void-all-branch-payment']);

  const { data, isLoading } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: async () => (await apiClient.get(`/fee/voucher/${voucherId}`)).data,
    enabled: !!token && !!voucherId,
  });

  const voucher = data?.data;
  const payments = voucher?.payments || [];
  const isFinal = voucher?.status === 'paid' || voucher?.status === 'void';

  if (isLoading || !voucher) {
    return (
      <div className="p-6 text-sm text-gray-500">Loading voucher...</div>
    );
  }

  return (
    <>
      <div className="p-6 print:p-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              {canRecordPayment && voucher.balanceAmount > 0 && voucher.status !== 'void' && (
                <button
                  onClick={() => setRecordOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                >
                  <Wallet className="w-4 h-4" /> Record Payment
                </button>
              )}
              {canUpdate && !isFinal && (
                <button
                  onClick={() => setLateFeeOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  <AlertOctagon className="w-4 h-4" /> Late Fee
                </button>
              )}
              {canRegenerate && voucher.status !== 'void' && (voucher.paidAmount || 0) === 0 && (
                <button
                  onClick={() => setRegenOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg text-sm hover:bg-amber-50"
                >
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </button>
              )}
              {canDelete && voucher.status !== 'void' && voucher.status !== 'paid' && (
                <button
                  onClick={() => setVoidVoucherOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  <Ban className="w-4 h-4" /> Void
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
            <div className="flex items-start justify-between border-b border-gray-200 pb-6 mb-6">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Voucher</div>
                <h1 className="text-3xl font-bold text-gray-900">{voucher.voucherNumber}</h1>
                <div className="text-sm text-gray-600 mt-1">
                  {formatMonth(voucher.month)} · {voucher.academicYear}
                </div>
              </div>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide ${
                  VOUCHER_STATUS_COLORS[voucher.status] || 'bg-gray-100'
                }`}
              >
                {voucher.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
              <Info label="Student" value={voucher.studentId?.user?.name || voucher.studentId?.admissionNumber} />
              <Info label="Admission #" value={voucher.studentId?.admissionNumber} />
              <Info label="Roll" value={voucher.studentId?.rollNumber} />
              <Info label="Class" value={`${voucher.classId?.name || ''} ${voucher.sectionId?.name ? `· ${voucher.sectionId.name}` : ''}`} />
              <Info label="Branch" value={voucher.branchId?.name} />
              <Info label="Due Date" value={formatDate(voucher.dueDate)} />
              <Info
                label="Discount"
                value={voucher.discountApplied ? `${voucher.discountApplied}%` : '—'}
              />
              <Info label="Waiver" value={voucher.waiverApplied ? 'Yes' : 'No'} />
            </div>

            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Line Items
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Frequency</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {(voucher.lineItems || []).map((li, i) => {
                    const isTransport = li.componentName === 'transport';
                    return (
                      <tr
                        key={i}
                        className={`border-t border-gray-100 ${isTransport ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {li.name}
                          {isTransport && (
                            <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-100 text-blue-700">
                              Transport
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-600">{li.frequency}</td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {formatMoney(li.amount)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          {formatMoney(li.finalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                  {voucher.lateFee > 0 && (
                    <tr className="border-t border-gray-100 bg-amber-50">
                      <td className="px-3 py-2 font-medium text-amber-800">Late Fee</td>
                      <td className="px-3 py-2 text-amber-700">—</td>
                      <td className="px-3 py-2 text-right text-amber-700">—</td>
                      <td className="px-3 py-2 text-right font-medium text-amber-900">
                        {formatMoney(voucher.lateFee)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end gap-1 text-sm">
              <Total label="Total" value={voucher.totalAmount} />
              <Total label="Paid" value={voucher.paidAmount} tone="text-green-700" />
              <Total label="Balance" value={voucher.balanceAmount} tone="text-red-700" big />
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 print:hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Payment History
              </h3>
              <span className="text-xs text-gray-500">{payments.length} payment(s)</span>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Receipt #</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Method</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">
                          {p.receiptNumber}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{formatDate(p.paymentDate)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              PAYMENT_METHOD_COLORS[p.method] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {p.method}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-medium ${
                            p.isVoid ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {formatMoney(p.amount)}
                        </td>
                        <td className="px-3 py-2">
                          {p.isVoid ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Void
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {canVoidPayment && !p.isVoid && (
                            <button
                              onClick={() => setVoidPaymentTarget(p)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Void
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <VoidVoucherModal
        isOpen={voidVoucherOpen}
        onClose={() => setVoidVoucherOpen(false)}
        voucher={voucher}
      />
      <LateFeeModal
        isOpen={lateFeeOpen}
        onClose={() => setLateFeeOpen(false)}
        voucher={voucher}
      />
      <RegenerateVoucherModal
        isOpen={regenOpen}
        onClose={() => setRegenOpen(false)}
        voucher={voucher}
      />
      <RecordPaymentModal
        isOpen={recordOpen}
        onClose={() => setRecordOpen(false)}
        voucher={voucher}
      />
      <VoidPaymentModal
        isOpen={!!voidPaymentTarget}
        onClose={() => setVoidPaymentTarget(null)}
        payment={voidPaymentTarget}
      />
    </>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-gray-900 font-medium">{value || '—'}</div>
    </div>
  );
}

function Total({ label, value, tone = 'text-gray-900', big }) {
  return (
    <div className={`flex items-center justify-end gap-4 ${big ? 'border-t pt-2 mt-1' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span className={`${big ? 'text-2xl font-bold' : 'font-medium'} ${tone}`}>
        {formatMoney(value)}
      </span>
    </div>
  );
}
