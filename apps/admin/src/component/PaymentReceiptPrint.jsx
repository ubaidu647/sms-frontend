'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { formatDate, formatMoney } from '@/constants/fee';

/**
 * Send only the receipt to the printer.
 *
 * The receipt lives in a portal on <body>, so marking the body while printing
 * lets the stylesheet drop every other top-level node — the dashboard behind
 * the dialog and the dialog's own chrome (the close ✕ and the action buttons)
 * included. Without this, window.print() paints the screen as it stands.
 */
export function printReceipt() {
  const body = document.body;
  body.classList.add('printing-receipt');
  const cleanup = () => {
    body.classList.remove('printing-receipt');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  // Safari fires afterprint unreliably — make sure the class never sticks.
  setTimeout(cleanup, 1000);
}

/**
 * The printable half of a payment receipt: school letterhead, payer, what was
 * paid and how. Renders nothing on screen — the modal keeps its own summary —
 * and only becomes visible on the printed page.
 *
 * `items` are the vouchers the money was applied to (one for a single
 * collection, several for a consolidated one) and `summary` the closing
 * figures shown under them.
 */
export default function PaymentReceiptPrint({
  branchId,
  branchName,
  title = 'Fee Receipt',
  receiptNumber,
  date,
  amount,
  accountLabel,
  referenceNumber,
  notes,
  student,
  items = [],
  summary = [],
  receivedBy,
}) {
  const { accessToken: token } = useTokenStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // The printable identity (logo, address, phones) lives on the branch profile.
  // It returns null when the branch has no profile saved yet.
  const { data: profileData, isFetched: profileFetched } = useQuery({
    queryKey: ['branch-profile', 'branch', branchId],
    queryFn: async () => (await apiClient.get(`/branch-profile/branch/${branchId}`)).data,
    enabled: !!token && !!branchId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const profile = profileData?.data || null;

  // Fallback when no branch profile exists: the school record still carries a
  // name, phone and email, which beats printing a receipt headed "School".
  const { data: schoolData } = useQuery({
    queryKey: ['school', 'self'],
    queryFn: async () => (await apiClient.get('/school', { params: { page: 1, limit: 1 } })).data,
    enabled: !!token && profileFetched && !profile,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });
  const school = schoolData?.data?.[0] || null;

  if (!mounted) return null;

  const schoolName = profile?.displayName || school?.name || branchName || 'School';
  const contact = (
    profile
      ? [profile.printPhone, profile.printEmail, profile.website]
      : [school?.phone, school?.email]
  ).filter(Boolean);

  return createPortal(
    <div className="receipt-print-portal">
      <div className="receipt-sheet">
        <header className="receipt-head">
          {profile?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logo} alt={schoolName} className="receipt-logo" />
          ) : null}
          <div className="receipt-head-text">
            <h1>{schoolName}</h1>
            {profile?.tagline && <p className="receipt-tagline">{profile.tagline}</p>}
            {profile?.printAddress && <p>{profile.printAddress}</p>}
            {contact.length > 0 && <p>{contact.join('  ·  ')}</p>}
            {profile?.registrationNumber && <p>Reg #: {profile.registrationNumber}</p>}
          </div>
        </header>

        <div className="receipt-title-row">
          <h2>{title}</h2>
          <div className="receipt-meta">
            <div>
              <strong>Receipt #</strong> {receiptNumber}
            </div>
            <div>
              <strong>Date</strong> {formatDate(date)}
            </div>
            {branchName && (
              <div>
                <strong>Branch</strong> {branchName}
              </div>
            )}
          </div>
        </div>

        <table className="receipt-info">
          <tbody>
            <tr>
              <th>Student</th>
              <td>{student?.name || '—'}</td>
              <th>Admission #</th>
              <td>{student?.admissionNumber || '—'}</td>
            </tr>
            <tr>
              <th>Class</th>
              <td>{student?.classLabel || '—'}</td>
              <th>Received In</th>
              <td>{accountLabel || '—'}</td>
            </tr>
            {(referenceNumber || receivedBy) && (
              <tr>
                <th>Reference</th>
                <td>{referenceNumber || '—'}</td>
                <th>Received By</th>
                <td>{receivedBy || '—'}</td>
              </tr>
            )}
          </tbody>
        </table>

        {items.length > 0 && (
          <table className="receipt-items">
            <thead>
              <tr>
                <th>Applied To</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{it.label}</td>
                  <td className="num">{formatMoney(it.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total Received</td>
                <td className="num">{formatMoney(amount)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {summary.length > 0 && (
          <table className="receipt-summary">
            <tbody>
              {summary.map((s, i) => (
                <tr key={i}>
                  <th>{s.label}</th>
                  <td className="num">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {notes && <p className="receipt-notes">Note: {notes}</p>}

        <div className="receipt-signs">
          <div>Received By</div>
          <div>Authorised Signature</div>
        </div>

        <p className="receipt-foot">Computer-generated receipt · {schoolName}</p>
      </div>
    </div>,
    document.body,
  );
}
