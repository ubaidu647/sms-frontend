'use client';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ArrowLeftRight, Ban, Plus, CreditCard, Eye, Receipt } from 'lucide-react';
import { fetchData } from '@/utils/api';
import { Table } from '@/component/Table';
import ConfirmModal from '../organizations/ConfirmModal';
import AssignSubscriptionModal from './AssignSubscriptionModal';
import ChangePlanModal from './ChangePlanModal';
import SubscriptionDetailModal from './SubscriptionDetailModal';
import InvoiceModal from './InvoiceModal';
import GracePeriodField from './GracePeriodField';
import {
  useCurrentSubscription,
  useSubscriptionHistory,
  useRenewSubscription,
  useCancelSubscription,
  useInvoiceSummary,
} from './hooks/useSubscriptions';
import {
  fmtMoney,
  fmtDate,
  effectiveLimit,
  SUB_STATUS_COLORS,
  validateGraceDays,
  graceCutoff,
} from '../packages/format';

const useSchools = () =>
  useQuery({
    queryKey: ['organizations', 'picker'],
    queryFn: () => fetchData({ url: '/schools', page: 1, limit: 200 }),
  });

const StatusPill = ({ status }) => (
  <span
    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
      SUB_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
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

export default function SubscriptionsPage() {
  const { data: schoolsData, isLoading: schoolsLoading } = useSchools();
  const schools = schoolsData?.data ?? [];

  const [schoolId, setSchoolId] = useState('');
  const selectedSchool = schools.find((s) => s._id === schoolId);

  const { data: currentData, isLoading: currentLoading } = useCurrentSubscription(schoolId);
  const current = currentData?.data ?? null;

  const { data: historyData, isLoading: historyLoading } = useSubscriptionHistory(schoolId);
  const history = historyData?.data ?? [];

  const { data: summaryData } = useInvoiceSummary(schoolId);
  const dues = summaryData?.data ?? null;

  const renew = useRenewSubscription();
  const cancel = useCancelSubscription();

  const [assignOpen, setAssignOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Renew is a confirm dialog, so its grace input lives here on the page.
  const [renewGrace, setRenewGrace] = useState('');
  const [renewError, setRenewError] = useState('');

  // Row that the History three-dots menu is acting on, plus which modal it opened.
  const [selectedSub, setSelectedSub] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

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
        render: (v) => <StatusPill status={v} />,
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
            Subscriptions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage each school&apos;s subscription.
          </p>
        </div>

        {/* School picker */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            School
          </label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            disabled={schoolsLoading}
            className="w-full sm:max-w-md px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">{schoolsLoading ? 'Loading schools…' : 'Select a school…'}</option>
            {schools.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {!schoolId ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
            Select a school to view its subscription.
          </div>
        ) : currentLoading ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            Loading subscription…
          </div>
        ) : (
          <>
            {/* Current subscription */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6 mb-6">
              {current ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {current.packageSnapshot?.name ?? 'Subscription'}
                        </h2>
                        <StatusPill status={current.status} />
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setChangeOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                        Change Plan
                      </button>
                      <button
                        onClick={() => {
                          setRenewGrace(
                            current?.gracePeriodInDays != null
                              ? String(current.gracePeriodInDays)
                              : '',
                          );
                          setRenewError('');
                          setRenewOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Renew
                      </button>
                      <button
                        onClick={() => setCancelOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm"
                      >
                        <Ban className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
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
                        {Object.entries(current.packageSnapshot?.platforms || {})
                          .filter(([, on]) => on)
                          .map(([k]) => k)
                          .join(', ') || 'None'}
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
                  {current.customLimits && Object.keys(current.customLimits).length > 0 && (
                    <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                      This school has custom limit overrides applied.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      No active subscription
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {selectedSchool?.name} has no active plan. Assign one to get started.
                    </p>
                  </div>
                  <button
                    onClick={() => setAssignOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors self-start"
                  >
                    <Plus className="w-5 h-5" />
                    Assign Subscription
                  </button>
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
              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                Open any plan in the history below and choose “View Invoice” to see its line items
                or mark it paid.
              </p>
            </div>

            {/* History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                History
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
                  rowActions={() => [
                    { label: 'View Details', value: 'details', icon: Eye },
                    { label: 'View Invoice', value: 'invoice', icon: Receipt },
                  ]}
                  onRowAction={(action, row) => {
                    setSelectedSub(row);
                    if (action === 'details') setDetailOpen(true);
                    if (action === 'invoice') setInvoiceOpen(true);
                  }}
                />
              )}
            </div>
          </>
        )}

        {/* Action modals */}
        <AssignSubscriptionModal
          isOpen={assignOpen}
          onClose={() => setAssignOpen(false)}
          schoolId={schoolId}
          schoolName={selectedSchool?.name}
        />
        <ChangePlanModal
          isOpen={changeOpen}
          onClose={() => setChangeOpen(false)}
          schoolId={schoolId}
          schoolName={selectedSchool?.name}
          current={current}
        />
        <ConfirmModal
          isOpen={renewOpen}
          onClose={() => setRenewOpen(false)}
          title="Renew Subscription"
          message={
            current
              ? `Renew “${current.packageSnapshot?.name}” for ${selectedSchool?.name}? This starts a fresh ${current.packageSnapshot?.durationInDays}-day cycle at current catalog pricing.`
              : ''
          }
          confirmLabel="Renew"
          confirmTone="primary"
          loading={renew.isPending}
          onConfirm={() => {
            const graceError = validateGraceDays(renewGrace);
            if (graceError) {
              setRenewError(graceError);
              return;
            }
            const payload = { schoolId };
            if (renewGrace !== '' && renewGrace != null) {
              payload.gracePeriodInDays = Number(renewGrace);
            }
            renew.mutate(payload, { onSuccess: () => setRenewOpen(false) });
          }}
        >
          <div className="mt-4">
            <GracePeriodField
              value={renewGrace}
              onChange={setRenewGrace}
              hint="Leave unchanged to keep the current grace period."
            />
            {renewError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{renewError}</p>
            )}
          </div>
        </ConfirmModal>
        <ConfirmModal
          isOpen={cancelOpen}
          onClose={() => setCancelOpen(false)}
          title="Cancel Subscription"
          message={
            selectedSchool
              ? `Cancel the active subscription for “${selectedSchool.name}”? The school will be left without an active plan.`
              : ''
          }
          confirmLabel="Cancel Subscription"
          confirmTone="danger"
          loading={cancel.isPending}
          onConfirm={() => cancel.mutate(schoolId, { onSuccess: () => setCancelOpen(false) })}
        />

        {/* History row actions */}
        <SubscriptionDetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          subscription={selectedSub}
        />
        <InvoiceModal
          isOpen={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
          subscription={selectedSub}
          schoolId={schoolId}
        />
      </div>
    </div>
  );
}
