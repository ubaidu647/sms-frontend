'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import {
  fmtMoney,
  fmtDate,
  effectiveLimit,
  SUB_STATUS_COLORS,
  graceCutoff,
} from '../packages/format';

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-gray-900 dark:text-gray-100 text-right">{children}</span>
  </div>
);

const LIMIT_KEYS = [
  ['noOfStudents', 'Students'],
  ['noOfBranches', 'Branches'],
  ['noOfStaffs', 'Staff'],
  ['noOfSections', 'Sections'],
];

// Read-only detail view for a single subscription row in the history table.
export default function SubscriptionDetailModal({ isOpen, onClose, subscription }) {
  const sub = subscription;
  const snap = sub?.packageSnapshot;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={snap?.name || 'Subscription'}
      subtitle={sub?.serialNumber ? `#${sub.serialNumber}` : undefined}
      size="lg"
      closeOnBackdrop
    >
      {!sub ? (
        <p className="text-gray-500 dark:text-gray-400">No subscription selected.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
                SUB_STATUS_COLORS[sub.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {sub.status || 'unknown'}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {fmtMoney(snap?.price)} · {snap?.durationInDays}d cycle
            </span>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <Row label="Start date">{fmtDate(sub.startDate)}</Row>
            <Row label="End date">{fmtDate(sub.endDate)}</Row>
            <Row label="Grace period">
              {sub.gracePeriodInDays ?? 0} {(sub.gracePeriodInDays ?? 0) === 1 ? 'day' : 'days'}
            </Row>
            {(sub.gracePeriodInDays ?? 0) > 0 && (
              <Row label="Access blocked after">
                {fmtDate(graceCutoff(sub.endDate, sub.gracePeriodInDays))}
              </Row>
            )}
            <Row label="Created">{fmtDate(sub.createdAt)}</Row>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Effective limits
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LIMIT_KEYS.map(([key, lbl]) => (
                <div
                  key={key}
                  className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-center"
                >
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {effectiveLimit(sub, key) ?? '∞'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lbl}</p>
                </div>
              ))}
            </div>
            {sub.customLimits && Object.keys(sub.customLimits).length > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Custom limit overrides are applied to this school.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm">
            <div className="mb-2">
              <span className="text-gray-500 dark:text-gray-400">Platforms: </span>
              <span className="text-gray-800 dark:text-gray-200 capitalize">
                {Object.entries(snap?.platforms || {})
                  .filter(([, on]) => on)
                  .map(([k]) => k)
                  .join(', ') || 'None'}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-gray-500 dark:text-gray-400">Dashboards: </span>
              <span className="text-gray-800 dark:text-gray-200 capitalize">
                {Object.entries(snap?.dashboards || {})
                  .filter(([, on]) => on)
                  .map(([k]) => k)
                  .join(', ') || 'None'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Features: </span>
              <span className="text-gray-800 dark:text-gray-200">
                {snap?.features?.length ? snap.features.join(', ') : 'All features'}
              </span>
            </div>
          </div>

          {(sub.paymentInfo?.method || sub.paymentInfo?.transactionId) && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Payment
              </h4>
              <Row label="Method">{sub.paymentInfo.method || '-'}</Row>
              <Row label="Transaction ID">{sub.paymentInfo.transactionId || '-'}</Row>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
