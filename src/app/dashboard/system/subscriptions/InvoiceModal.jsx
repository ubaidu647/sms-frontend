'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { fmtMoney, fmtDate, INVOICE_STATUS_COLORS } from '../packages/format';
import { useInvoiceBySubscription, useMarkInvoicePaid } from './hooks/useSubscriptions';

// Shows the invoice tied to a single subscription (assign/change/renew each
// create one). Lets a super-admin mark an unpaid invoice as paid.
export default function InvoiceModal({ isOpen, onClose, subscription, schoolId }) {
  const subscriptionId = subscription?._id;
  const { data, isLoading, isError, error } = useInvoiceBySubscription(
    isOpen ? subscriptionId : null,
  );
  const invoice = data?.data ?? null;
  const markPaid = useMarkInvoicePaid(schoolId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice"
      subtitle={
        invoice?.serialNumber
          ? `#${invoice.serialNumber}`
          : subscription?.packageSnapshot?.name || undefined
      }
      size="lg"
      closeOnBackdrop
      footer={
        invoice && invoice.status === 'unpaid' ? (
          <Button
            label="Mark as paid"
            handleClick={() => markPaid.mutate({ id: invoice._id }, { onSuccess: () => onClose() })}
            loading={markPaid.isPending}
            type="button"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        ) : undefined
      }
    >
      {isLoading ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">Loading invoice…</p>
      ) : isError ? (
        <p className="py-8 text-center text-red-600 dark:text-red-400">
          {error?.message || 'Could not load the invoice.'}
        </p>
      ) : !invoice ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">
          No invoice found for this subscription.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  INVOICE_STATUS_COLORS[invoice.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {invoice.status || 'unknown'}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {invoice.type} · {fmtDate(invoice.createdAt)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {(invoice.lineItems || []).map((li, i) => (
              <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-700 dark:text-gray-300">{li.label}</span>
                <span
                  className={
                    li.amount < 0
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }
                >
                  {li.amount < 0 ? `−${fmtMoney(Math.abs(li.amount))}` : fmtMoney(li.amount)}
                </span>
              </div>
            ))}
            {invoice.creditApplied > 0 && (
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Credit applied</span>
                <span className="text-green-700 dark:text-green-400">
                  −{fmtMoney(invoice.creditApplied)}
                </span>
              </div>
            )}
            <div className="flex justify-between px-4 py-3 text-base font-semibold bg-gray-50 dark:bg-gray-800/60">
              <span className="text-gray-900 dark:text-gray-100">Amount due</span>
              <span
                className={
                  invoice.status === 'paid'
                    ? 'text-green-700 dark:text-green-400'
                    : invoice.status === 'void'
                      ? 'text-gray-400 dark:text-gray-500 line-through'
                      : 'text-gray-900 dark:text-gray-100'
                }
              >
                {fmtMoney(invoice.amountDue)}
              </span>
            </div>
          </div>

          {invoice.status === 'void' && (
            <p className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-sm text-gray-500 dark:text-gray-400">
              This invoice was voided when the plan changed before it was paid — nothing is owed on
              it.
            </p>
          )}

          {(invoice.paymentInfo?.method || invoice.paymentInfo?.transactionId) && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment</h4>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400">Method</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {invoice.paymentInfo.method || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {invoice.paymentInfo.transactionId || '-'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
