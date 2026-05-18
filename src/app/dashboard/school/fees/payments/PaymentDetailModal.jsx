'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Printer, Download, Receipt, School, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import {
  formatDate,
  formatMoney,
  formatMonth,
  PAYMENT_METHOD_COLORS,
  VOUCHER_STATUS_COLORS,
} from '@/constants/fee';

export default function PaymentDetailModal({ isOpen, onClose, paymentId }) {
  const { accessToken: token } = useTokenStore();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printableRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => (await apiClient.get(`/fee/payment/${paymentId}`)).data,
    enabled: !!token && isOpen && !!paymentId,
  });

  const p = data?.data;
  const voucherRef = p?.voucherId;
  const voucherIdValue = voucherRef && typeof voucherRef === 'object' ? voucherRef._id : voucherRef;

  const { data: voucherData } = useQuery({
    queryKey: ['voucher', voucherIdValue],
    queryFn: async () => (await apiClient.get(`/fee/voucher/${voucherIdValue}`)).data,
    enabled: !!token && isOpen && !!voucherIdValue,
  });

  const voucher =
    voucherData?.data || (voucherRef && typeof voucherRef === 'object' ? voucherRef : null);
  const student =
    voucher?.studentId && typeof voucher.studentId === 'object' ? voucher.studentId : null;

  const branchIdForProfile =
    typeof voucher?.branchId === 'object' ? voucher?.branchId?._id : voucher?.branchId;

  const { data: profileData } = useQuery({
    queryKey: ['branch-profile', 'branch', branchIdForProfile],
    queryFn: async () => (await apiClient.get(`/branch-profile/branch/${branchIdForProfile}`)).data,
    enabled: !!token && !!branchIdForProfile,
  });

  const profile = profileData?.data || null;

  const handlePrint = () => {
    if (!printableRef.current) return;
    const html = printableRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) return;
    win.document.write(
      `<!doctype html><html><head><title>Receipt ${p?.receiptNumber || ''}</title>`,
    );
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((el) => {
      win.document.write(el.outerHTML);
    });
    win.document.write('</head><body class="bg-white">');
    win.document.write(html);
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  const handleDownloadPdf = async () => {
    if (!printableRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);
      const filename = `Receipt-${p?.receiptNumber || paymentId}.pdf`;
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Receipt" size="xl">
      {isLoading || !p ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 justify-end mb-4">
            <button
              onClick={handlePrint}
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
          </div>

          <div ref={printableRef}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <Letterhead profile={profile} branchName={voucher?.branchId?.name} />

              <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Payment Receipt
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {p.receiptNumber}
                  </h1>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(p.paymentDate)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      PAYMENT_METHOD_COLORS[p.method] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {p.method}
                  </span>
                  {p.isVoid && (
                    <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:text-red-400">
                      Voided
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                <Info label="Student Name" value={student?.user?.name} />
                <Info label="Father Name" value={student?.father?.name} />
                <Info label="Admission #" value={student?.admissionNumber} />
                <Info label="Roll" value={student?.rollNumber} />
                <Info
                  label="Class"
                  value={`${voucher?.classId?.name || ''} ${
                    voucher?.sectionId?.name ? `· ${voucher.sectionId.name}` : ''
                  }`}
                />
                <Info label="Branch" value={voucher?.branchId?.name} />
                <Info
                  label="Voucher Month"
                  value={
                    voucher?.month
                      ? `${formatMonth(voucher.month)}${voucher.academicYear ? ` · ${voucher.academicYear}` : ''}`
                      : '—'
                  }
                />
                <Info
                  label="Voucher Due"
                  value={voucher?.dueDate ? formatDate(voucher.dueDate) : '—'}
                />
              </div>

              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Payment Details
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Field</th>
                      <th className="px-3 py-2 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <DetailRow label="Receipt #" value={p.receiptNumber} mono />
                    <DetailRow label="Date" value={formatDate(p.paymentDate)} />
                    <DetailRow label="Method" value={p.method} capitalize />
                    <DetailRow label="Reference #" value={p.referenceNumber || '—'} />
                    <DetailRow
                      label="Received By"
                      value={p.receivedBy?.user?.name || p.receivedBy?.name || '—'}
                    />
                    {p.notes && <DetailRow label="Notes" value={p.notes} />}
                    {p.isVoid && (
                      <>
                        <DetailRow label="Voided At" value={formatDate(p.voidedAt)} />
                        <DetailRow
                          label="Voided By"
                          value={p.voidedBy?.user?.name || p.voidedBy?.name || '—'}
                        />
                        <DetailRow label="Void Reason" value={p.voidReason || '—'} />
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-4 mb-6">
                {!p.isVoid && profile?.stamp ? (
                  <img
                    src={profile.stamp}
                    alt="Paid stamp"
                    className="h-52 w-52 object-contain opacity-80 -rotate-12"
                  />
                ) : (
                  <div />
                )}
                <div className="flex flex-col items-end gap-1 text-sm">
                  <Total label="Amount Received" value={p.amount} big strike={p.isVoid} />
                  {voucher && (
                    <>
                      <Total label="Voucher Total" value={voucher.totalAmount} />
                      <Total
                        label="Voucher Paid"
                        value={voucher.paidAmount}
                        tone="text-green-700"
                      />
                      <Total
                        label="Voucher Balance"
                        value={voucher.balanceAmount}
                        tone="text-red-700"
                      />
                    </>
                  )}
                </div>
              </div>

              {voucher && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Receipt className="w-4 h-4" />
                    <span>Voucher</span>
                    <Link
                      href={`/dashboard/school/fees/vouchers/${voucher._id || p.voucherId}`}
                      className="font-medium text-teal-700 dark:text-teal-400 hover:underline"
                      onClick={onClose}
                    >
                      {voucher.voucherNumber || 'Open voucher →'}
                    </Link>
                  </div>
                  {voucher.status && (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        VOUCHER_STATUS_COLORS[voucher.status] || 'bg-gray-100'
                      }`}
                    >
                      {voucher.status}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
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
          Payment Receipt
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">Student Ledger</div>
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
      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{value || '—'}</div>
    </div>
  );
}

function DetailRow({ label, value, mono, capitalize }) {
  return (
    <tr className="border-t border-gray-100 dark:border-gray-800">
      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 w-1/3">{label}</td>
      <td
        className={`px-3 py-2 font-medium text-gray-900 dark:text-gray-100 ${
          mono ? 'font-mono text-xs' : ''
        } ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </td>
    </tr>
  );
}

function Total({ label, value, tone = 'text-gray-900', big, strike }) {
  return (
    <div className={`flex items-center justify-end gap-4 ${big ? 'border-t pt-2 mt-1' : ''}`}>
      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span
        className={`${big ? 'text-2xl font-bold' : 'font-medium'} ${tone} ${
          strike ? 'line-through text-gray-400' : ''
        }`}
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}
