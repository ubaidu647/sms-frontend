'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { useTokenStore } from '@/store/tokenStore';
import {
  applicantDetail,
  applicantName,
  formatLeaveRange,
  leaveDateYMD,
  requestedByLabel,
} from '@/utils/leave';
import { StatusBadge, PaySplit, leaveTypeLabel } from './leaveShared';

const Row = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
    <dt className="sm:w-40 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
      {label}
    </dt>
    <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">{children}</dd>
  </div>
);

const fmtDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
};

const nameOf = (v) => (v && typeof v === 'object' ? v.name || '' : '');

export default function LeaveDetailModal({ requestId, onClose }) {
  const { accessToken: token } = useTokenStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['leave-request', requestId],
    queryFn: () => fetchData({ url: `/leave/${requestId}`, token }),
    enabled: !!token && !!requestId,
    retry: retryUnless4xx,
  });
  const r = data?.data;

  return (
    <Modal isOpen={!!requestId} onClose={onClose} title="Leave request" size="md" closeOnBackdrop>
      {isLoading && (
        <div className="py-10 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && <QueryErrorState error={error} fallback="Could not load this request" />}
      {r && (
        <dl>
          <Row label="Applicant">
            {applicantName(r)}
            {applicantDetail(r) && (
              <span className="text-gray-500 dark:text-gray-400"> · {applicantDetail(r)}</span>
            )}
            <span className="ml-2 text-xs capitalize text-gray-500">({r.applicantType})</span>
          </Row>
          <Row label="Status">
            <StatusBadge status={r.status} />
          </Row>
          <Row label="Type">{leaveTypeLabel(r.leaveType)}</Row>
          <Row label="Dates">{formatLeaveRange(r.fromDate, r.toDate)}</Row>
          <Row label="Working days">
            {r.days ?? '—'}
            {r.leaveYear && <span className="text-gray-500"> · leave year {r.leaveYear}</span>}
          </Row>
          {r.applicantType === 'staff' && (
            <Row label="Paid / unpaid">
              <PaySplit request={r} />
            </Row>
          )}
          {Array.isArray(r.skippedDates) && r.skippedDates.length > 0 && (
            <Row label="Skipped days">
              {r.skippedDates.map(leaveDateYMD).join(', ')}
              <span className="block text-xs text-gray-500">
                Already marked present/late/half-day — not counted as leave.
              </span>
            </Row>
          )}
          <Row label="Reason">{r.reason || '—'}</Row>
          <Row label="Requested by">
            {requestedByLabel(r)}
            {r.createdAt && <span className="text-gray-500"> · {fmtDateTime(r.createdAt)}</span>}
          </Row>
          {(r.decidedAt || r.decidedBy) && (
            <Row label="Decided by">
              {nameOf(r.decidedBy) || r.decidedByName || '—'}
              {r.decidedAt && <span className="text-gray-500"> · {fmtDateTime(r.decidedAt)}</span>}
            </Row>
          )}
          {r.decisionNote && <Row label="Note">{r.decisionNote}</Row>}
          {r.cancelledAt && (
            <Row label="Cancelled">
              {nameOf(r.cancelledBy) || '—'}
              <span className="text-gray-500"> · {fmtDateTime(r.cancelledAt)}</span>
            </Row>
          )}
        </dl>
      )}
    </Modal>
  );
}
