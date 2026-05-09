'use client';
import React, { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Download,
  Wallet,
  AlertOctagon,
  Ban,
  Receipt,
  RefreshCw,
  School,
  Phone,
  Mail,
  MapPin,
  Globe,
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printableRef = useRef(null);

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

  const branchIdForProfile =
    typeof voucher?.branchId === 'object' ? voucher?.branchId?._id : voucher?.branchId;

  const { data: profileData } = useQuery({
    queryKey: ['branch-profile', 'branch', branchIdForProfile],
    queryFn: async () =>
      (await apiClient.get(`/branch-profile/branch/${branchIdForProfile}`)).data,
    enabled: !!token && !!branchIdForProfile,
  });

  const profile = profileData?.data || null;

  const handleDownloadPdf = async () => {
    if (!printableRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);
      const filename = `Voucher-${voucher.voucherNumber || voucherId}.pdf`;
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }
      pdf.save(filename);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading || !voucher) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading voucher...</div>
    );
  }

  return (
    <>
      <div className="p-6 print:p-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {downloadingPdf ? 'Generating…' : 'Download PDF'}
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
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <AlertOctagon className="w-4 h-4" /> Late Fee
                </button>
              )}
              {canRegenerate && voucher.status !== 'void' && (voucher.paidAmount || 0) === 0 && (
                <button
                  onClick={() => setRegenOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-amber-300 text-amber-700 rounded-lg text-sm hover:bg-amber-50"
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

          <div ref={printableRef}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 print:shadow-none print:border-0">
            <Letterhead profile={profile} branchName={voucher.branchId?.name} />

            <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">Voucher</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{voucher.voucherNumber}</h1>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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

            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              Line Items
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
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
                        className={`border-t border-gray-100 dark:border-gray-800 ${isTransport ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                          {li.name}
                          {isTransport && (
                            <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-100 text-blue-700 dark:text-blue-400">
                              Transport
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-600 dark:text-gray-400">{li.frequency}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatMoney(li.amount)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                          {formatMoney(li.finalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                  {voucher.lateFee > 0 && (
                    <tr className="border-t border-gray-100 dark:border-gray-800 bg-amber-50">
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

          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 print:shadow-none print:border-0 print:rounded-none print:mt-4 print:p-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Payment History
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{payments.length} payment(s)</span>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
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
                      <tr key={p._id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                          {p.receiptNumber}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{formatDate(p.paymentDate)}</td>
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
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:text-red-400">
                              Void
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:text-green-400">
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

function Letterhead({ profile, branchName }) {
  const displayName = profile?.displayName || branchName || 'School';
  const tagline = profile?.tagline;
  const address = profile?.printAddress;
  const phone = profile?.printPhone;
  const email = profile?.printEmail;
  const website = profile?.website;
  const regNo = profile?.registrationNumber;
  const logo = profile?.logo;

  return (
    <div className="flex items-start gap-4 pb-5 mb-5 border-b-2 border-gray-900">
      <div className="shrink-0">
        {logo ? (
          <img
            src={logo}
            alt={displayName}
            className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <School className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight truncate">
          {displayName}
        </h2>
        {tagline && (
          <div className="text-xs text-gray-600 dark:text-gray-400 italic mt-0.5">{tagline}</div>
        )}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
          {address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="break-words">{address}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span>{phone}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="break-all">{email}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="break-all">{website}</span>
            </div>
          )}
        </div>
        {regNo && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Reg #: {regNo}</div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Fee Voucher
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">Student Ledger</div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{value || '—'}</div>
    </div>
  );
}

function Total({ label, value, tone = 'text-gray-900', big }) {
  return (
    <div className={`flex items-center justify-end gap-4 ${big ? 'border-t pt-2 mt-1' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`${big ? 'text-2xl font-bold' : 'font-medium'} ${tone}`}>
        {formatMoney(value)}
      </span>
    </div>
  );
}
