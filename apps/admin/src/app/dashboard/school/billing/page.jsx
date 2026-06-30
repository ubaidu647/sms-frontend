'use client';
import React, { useMemo, useState } from 'react';
import { CreditCard, Receipt, Eye } from 'lucide-react';
import { Table } from '@/component/Table';
import MyInvoiceModal from './MyInvoiceModal';
import SubscriptionDetailModal from '../../system/subscriptions/SubscriptionDetailModal';
import {
  useMyCurrentSubscription,
  useMySubscriptionHistory,
  useMyInvoiceSummary,
  useMyInvoices,
} from './hooks/useBilling';
import {
  fmtMoney,
  fmtDate,
  effectiveLimit,
  SUB_STATUS_COLORS,
  INVOICE_STATUS_COLORS,
  graceCutoff,
} from '../../system/packages/format';

const StatusPill = ({ status, colors }) => (
  <span
    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
      colors[status] || 'bg-gray-100 text-gray-800'
    }`}
  >
    {status || 'unknown'}
  </span>
);

const LimitStat = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value ?? '∞'}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
  </div>
);

export default function BillingPage() {
  const { data: currentData, isLoading: currentLoading } = useMyCurrentSubscription();
  const current = currentData?.data ?? null;

  const { data: summaryData } = useMyInvoiceSummary();
  const dues = summaryData?.data ?? null;

  const { data: invoicesData, isLoading: invoicesLoading } = useMyInvoices();
  const invoices = invoicesData?.data ?? [];

  const { data: historyData, isLoading: historyLoading } = useMySubscriptionHistory();
  const history = historyData?.data ?? [];
  const entitlements = historyData?.custom ?? null;

  const activePlatforms = Object.entries(entitlements?.platforms || {})
    .filter(([, on]) => on)
    .map(([k]) => k);
  const activeDashboards = Object.entries(entitlements?.dashboards || {})
    .filter(([, on]) => on)
    .map(([k]) => k);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const [selectedSub, setSelectedSub] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const invoiceColumns = useMemo(
    () => [
      {
        header: 'Invoice #',
        accessor: 'serialNumber',
        render: (v) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">{v ?? '-'}</span>
        ),
      },
      {
        header: 'Type',
        accessor: 'type',
        render: (v) => <span className="capitalize text-gray-700 dark:text-gray-300">{v}</span>,
      },
      {
        header: 'Date',
        accessor: 'createdAt',
        render: (v) => <span className="text-gray-600 dark:text-gray-400">{fmtDate(v)}</span>,
      },
      {
        header: 'Amount',
        accessor: 'amountDue',
        render: (v) => <span className="text-gray-900 dark:text-gray-100">{fmtMoney(v)}</span>,
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => <StatusPill status={v} colors={INVOICE_STATUS_COLORS} />,
      },
    ],
    [],
  );
  const invoiceVisible = invoiceColumns.map((c) => c.accessor);

  const historyColumns = useMemo(
    () => [
      {
        header: 'Plan',
        accessor: 'packageSnapshot',
        render: (v) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">{v?.name ?? '-'}</span>
        ),
      },
      {
        header: 'Price',
        accessor: 'price',
        render: (_v, row) => (
          <span className="text-gray-700 dark:text-gray-300">
            {fmtMoney(row.packageSnapshot?.price)}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => <StatusPill status={v} colors={SUB_STATUS_COLORS} />,
      },
      {
        header: 'Start',
        accessor: 'startDate',
        render: (v) => <span className="text-gray-600 dark:text-gray-400">{fmtDate(v)}</span>,
      },
      {
        header: 'End',
        accessor: 'endDate',
        render: (v) => <span className="text-gray-600 dark:text-gray-400">{fmtDate(v)}</span>,
      },
    ],
    [],
  );
  const historyVisible = historyColumns.map((c) => c.accessor);

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Billing &amp; Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your current plan, outstanding balance and invoice history.
          </p>
        </div>

        {/* Current plan */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6 mb-6">
          {currentLoading ? (
            <p className="py-6 text-center text-gray-500 dark:text-gray-400">Loading plan…</p>
          ) : current ? (
            <>
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {current.packageSnapshot?.name ?? 'Subscription'}
                  </h2>
                  <StatusPill status={current.status} colors={SUB_STATUS_COLORS} />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {fmtMoney(current.packageSnapshot?.price)} ·{' '}
                  {current.packageSnapshot?.durationInDays}d cycle
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {fmtDate(current.startDate)} → {fmtDate(current.endDate)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Grace period: {current.gracePeriodInDays ?? 0}{' '}
                  {(current.gracePeriodInDays ?? 0) === 1 ? 'day' : 'days'}
                  {(current.gracePeriodInDays ?? 0) > 0 && (
                    <>
                      {' '}
                      · access blocked after{' '}
                      {fmtDate(graceCutoff(current.endDate, current.gracePeriodInDays))}
                    </>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <LimitStat label="Students" value={effectiveLimit(current, 'noOfStudents')} />
                <LimitStat label="Branches" value={effectiveLimit(current, 'noOfBranches')} />
                <LimitStat label="Staff" value={effectiveLimit(current, 'noOfStaffs')} />
                <LimitStat label="Sections" value={effectiveLimit(current, 'noOfSections')} />
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Platforms: </span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">
                    {(activePlatforms.length
                      ? activePlatforms
                      : Object.entries(current.packageSnapshot?.platforms || {})
                          .filter(([, on]) => on)
                          .map(([k]) => k)
                    ).join(', ') || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Dashboards: </span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">
                    {activeDashboards.join(', ') || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Features: </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {current.packageSnapshot?.features?.length
                      ? current.packageSnapshot.features.join(', ')
                      : 'All features'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                No active subscription
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Your school has no active plan. Please contact your administrator to set one up.
              </p>
            </div>
          )}
        </div>

        {/* Billing & dues */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Billing &amp; Dues
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {fmtMoney(dues?.totalDue ?? 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Outstanding dues</p>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {fmtMoney(dues?.totalPaid ?? 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total paid</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {dues?.unpaidCount ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unpaid invoices</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {dues?.invoiceCount ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total invoices</p>
            </div>
          </div>
          {(dues?.totalDue ?? 0) > 0 && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              You have an outstanding balance. Invoices are settled by your administrator.
            </p>
          )}
        </div>

        {/* Invoices */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Invoices</h3>
          {invoicesLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Loading invoices…
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No invoices yet.
            </div>
          ) : (
            <Table
              columns={invoiceColumns}
              data={invoices}
              visibleColumns={invoiceVisible}
              rowActions={() => [{ label: 'View Invoice', value: 'view', icon: Eye }]}
              onRowAction={(_action, row) => {
                setSelectedInvoice(row);
                setInvoiceOpen(true);
              }}
            />
          )}
        </div>

        {/* Plan history */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Plan History
          </h3>
          {historyLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No subscription history.
            </div>
          ) : (
            <Table
              columns={historyColumns}
              data={history}
              visibleColumns={historyVisible}
              rowActions={() => [{ label: 'View Details', value: 'details', icon: Eye }]}
              onRowAction={(_action, row) => {
                setSelectedSub(row);
                setDetailOpen(true);
              }}
            />
          )}
        </div>

        <MyInvoiceModal
          isOpen={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
          invoice={selectedInvoice}
        />
        <SubscriptionDetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          subscription={selectedSub}
        />
      </div>
    </div>
  );
}
