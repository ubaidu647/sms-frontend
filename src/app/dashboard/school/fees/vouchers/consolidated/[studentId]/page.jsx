'use client';
import React, { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Download,
  Wallet,
  School,
  Phone,
  Mail,
  MapPin,
  Globe,
  CheckCircle2,
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
  VOUCHER_STATUS_COLORS,
} from '@/constants/fee';
import PayConsolidatedModal from '../PayConsolidatedModal';

export default function ConsolidatedVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.studentId;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const [payOpen, setPayOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printableRef = useRef(null);

  const isOwnOnly = resolveScope(user?.role, 'view-fee') === 'own';
  const canPay =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['record-payment', 'record-all-branch-payment']);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['consolidated', studentId],
    queryFn: async () =>
      (await apiClient.get(`/fee/voucher/consolidated/${studentId}`)).data,
    enabled: !!token && !!studentId,
  });

  const slip = data?.data;
  const student = slip?.student;
  const branchIdForProfile =
    typeof student?.branch === 'object' ? student?.branch?._id : student?.branch;

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
      const filename = `Consolidated-${student?.admissionNumber || studentId}.pdf`;
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

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
        Loading consolidated slip...
      </div>
    );
  }

  if (isError) {
    const status = error?.response?.status;
    const msg =
      error?.response?.data?.message ||
      (status === 403
        ? "You don't have access to this student"
        : status === 404
        ? 'Student not found'
        : 'Failed to load consolidated slip');
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-red-200 rounded-2xl p-6 text-sm text-red-700 dark:text-red-400">
          {msg}
        </div>
      </div>
    );
  }

  if (!slip) return null;

  const totals = slip.totals || {};
  const vouchers = slip.vouchers || [];
  const outstanding = totals.outstandingTotal ?? 0;
  const hasArrears = outstanding > 0 && vouchers.length > 0;

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
              {canPay && hasArrears && (
                <button
                  onClick={() => setPayOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                >
                  <Wallet className="w-4 h-4" /> Pay Arrears
                </button>
              )}
            </div>
          </div>

          <div ref={printableRef}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 print:shadow-none print:border-0">
              <Letterhead profile={profile} branchName={student?.branch?.name} />

              <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Consolidated Arrears Slip
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {student?.user?.name || 'Student'}
                  </h1>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {student?.admissionNumber ? `Adm #${student.admissionNumber}` : ''}
                    {student?.rollNumber ? ` · Roll ${student.rollNumber}` : ''}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    Issued:{' '}
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {formatDate(slip.issuedDate)}
                    </span>
                  </div>
                  {slip.earliestDueDate && (
                    <div className="mt-1">
                      Earliest Due:{' '}
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {formatDate(slip.earliestDueDate)}
                      </span>
                    </div>
                  )}
                  <div className="mt-1">
                    Months:{' '}
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {totals.voucherCount ?? vouchers.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                <Info label="Student Name" value={student?.user?.name} />
                <Info label="Admission #" value={student?.admissionNumber} />
                <Info label="Roll" value={student?.rollNumber} />
                <Info
                  label="Class"
                  value={`${student?.class?.name || ''}${
                    student?.section?.name ? ` · ${student.section.name}` : ''
                  }`}
                />
                <Info label="Branch" value={student?.branch?.name} />
                {student?.class?.grade != null && (
                  <Info label="Grade" value={student.class.grade} />
                )}
              </div>

              {!hasArrears ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-14 h-14 text-green-500 mb-3" />
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    All clear
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    No outstanding fees for this student.
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Outstanding Vouchers
                  </h3>
                  <div className="space-y-4 mb-6">
                    {vouchers.map((v) => (
                      <div
                        key={v._id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatMonth(v.month)}
                            </span>
                            <span className="text-gray-400">·</span>
                            <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                              {v.voucherNumber}
                            </span>
                            {v.dueDate && (
                              <>
                                <span className="text-gray-400">·</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Due {formatDate(v.dueDate)}
                                </span>
                              </>
                            )}
                          </div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              VOUCHER_STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Item</th>
                              <th className="px-3 py-2 text-left">Frequency</th>
                              <th className="px-3 py-2 text-right">Amount</th>
                              <th className="px-3 py-2 text-right">Final</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(v.lineItems || []).map((li, i) => (
                              <tr
                                key={i}
                                className="border-t border-gray-100 dark:border-gray-800"
                              >
                                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                                  {li.name}
                                </td>
                                <td className="px-3 py-2 capitalize text-gray-600 dark:text-gray-400">
                                  {li.frequency || '—'}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                                  {formatMoney(li.amount)}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                                  {formatMoney(li.finalAmount)}
                                </td>
                              </tr>
                            ))}
                            {v.lateFee > 0 && (
                              <tr className="border-t border-gray-100 dark:border-gray-800 bg-amber-50">
                                <td className="px-3 py-2 font-medium text-amber-800">
                                  Late Fee
                                </td>
                                <td className="px-3 py-2 text-amber-700">—</td>
                                <td className="px-3 py-2 text-right text-amber-700">—</td>
                                <td className="px-3 py-2 text-right font-medium text-amber-900">
                                  {formatMoney(v.lateFee)}
                                </td>
                              </tr>
                            )}
                            <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                              <td
                                colSpan={2}
                                className="px-3 py-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                              >
                                Subtotal · Paid · Balance
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                                {formatMoney(v.totalAmount)} ·{' '}
                                <span className="text-green-700">
                                  {formatMoney(v.paidAmount)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right text-sm font-semibold text-red-700">
                                {formatMoney(v.balanceAmount)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-end justify-end">
                    <div className="flex flex-col items-end gap-1 text-sm">
                      <Total label="Gross Total" value={totals.grossTotal} />
                      <Total
                        label="Total Paid"
                        value={totals.totalPaid}
                        tone="text-green-700"
                      />
                      {totals.totalLateFee > 0 && (
                        <Total
                          label="Late Fee"
                          value={totals.totalLateFee}
                          tone="text-amber-700"
                        />
                      )}
                      <Total
                        label="Outstanding"
                        value={totals.outstandingTotal}
                        tone="text-red-700"
                        big
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <PayConsolidatedModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        studentId={studentId}
        outstandingTotal={outstanding}
        studentLabel={student?.user?.name}
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
          <div className="text-xs text-gray-600 dark:text-gray-400 italic mt-0.5">
            {tagline}
          </div>
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
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Reg #: {regNo}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Arrears Slip
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          Student Ledger
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
        {value || '—'}
      </div>
    </div>
  );
}

function Total({ label, value, tone = 'text-gray-900', big }) {
  return (
    <div className={`flex items-center justify-end gap-4 ${big ? 'border-t pt-2 mt-1' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className={`${big ? 'text-2xl font-bold' : 'font-medium'} ${tone}`}>
        {formatMoney(value)}
      </span>
    </div>
  );
}
