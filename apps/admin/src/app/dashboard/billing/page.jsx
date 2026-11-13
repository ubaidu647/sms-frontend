'use client';
import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Receipt, Eye, AlertTriangle } from 'lucide-react';
import { Table } from '@/component/Table';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { paymentDueSoon } from '@/utils/subscriptionState';
import {
  ADDON_KEYS,
  addonModulesOf,
  addonUnits,
  baseLimit,
  buyableModuleOffers,
  isModuleAddon,
  livePriceLock,
  pricedAddons,
} from '@/utils/planAddons';
import { storageUsage } from '@/utils/storage';
import { moduleName } from '@/component/PlanUpgrade';
import MyInvoiceModal from './MyInvoiceModal';
import SubscriptionDetailModal from './SubscriptionDetailModal';
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
} from './format';

const HISTORY_PAGE_SIZE = 100;

// The server pages history; say so when there's more than one page of it.
function HistoryPager({ page, shown, total, onPage }) {
  const count = typeof total === 'number' ? total : shown;
  const pageCount = Math.max(1, Math.ceil(count / HISTORY_PAGE_SIZE));
  if (pageCount <= 1) return null;
  const start = (page - 1) * HISTORY_PAGE_SIZE + 1;
  const btn =
    'px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs text-gray-600 dark:text-gray-400">
      <span>
        Showing {start}–{start + shown - 1} of {count} subscriptions
      </span>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          className={btn}
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const StatusPill = ({ status, colors }) => (
  <span
    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
      colors[status] || 'bg-gray-100 text-gray-800'
    }`}
  >
    {status || 'unknown'}
  </span>
);

const LIMIT_LABELS = {
  noOfStudents: 'Students',
  noOfBranches: 'Branches',
  noOfStaffs: 'Staff',
  noOfSections: 'Sections',
};

// `breakdown` (e.g. "300 + 100 add-on") shows when add-ons raise the limit.
const LimitStat = ({ label, value, breakdown }) => (
  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value ?? '∞'}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    {breakdown && <p className="text-xs text-teal-700 dark:text-teal-400">({breakdown})</p>}
  </div>
);

// Upload storage: used / limit with a bar that turns amber at 90% and red when full.
function StorageCard({ storage }) {
  const t = useTranslations('billing');
  const u = storageUsage(storage);
  if (!u) return null;
  const tone = u.full
    ? 'border-red-300 dark:border-red-800'
    : u.warn
      ? 'border-amber-300 dark:border-amber-800'
      : 'border-gray-200 dark:border-gray-700';
  const bar = u.full ? 'bg-red-600' : u.warn ? 'bg-amber-500' : 'bg-teal-600';
  const text = u.full
    ? 'text-red-700 dark:text-red-400'
    : u.warn
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-gray-700 dark:text-gray-300';
  return (
    <div className={`mb-4 rounded-lg border p-4 text-sm ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('storageTitle')}</span>
        <span className={text}>
          {u.unlimited
            ? t('storageUnlimited', { used: u.usedText })
            : t('storageUsed', { used: u.usedText, limit: u.limitText, percent: u.percent })}
        </span>
      </div>
      {!u.unlimited && (
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
          role="progressbar"
          aria-label={t('storageTitle')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={u.percent}
        >
          <div className={`h-full ${bar}`} style={{ width: `${u.percent}%` }} />
        </div>
      )}
      {(u.warn || u.full) && (
        <p className={`mt-2 text-xs ${text}`}>{u.full ? t('storageFull') : t('storageWarn')}</p>
      )}
    </div>
  );
}

// The launch-offer price the school renews at while its lock runs.
function PriceLockNote({ current }) {
  const t = useTranslations('billing');
  const lock = current?.priceLock;
  if (!lock || lock.price == null) return null;
  const live = !!livePriceLock(current);
  return (
    <p
      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        live
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      {t(live ? 'priceLock' : 'priceLockEnded', {
        price: fmtMoney(lock.price),
        date: fmtDate(lock.until),
      })}
    </p>
  );
}

// Gated modules the school could add, with their prices, and the ones its
// add-ons already opened. Bought through the platform admin, not here.
function ModuleAddons({ current }) {
  const t = useTranslations('billing');
  const tm = useTranslations('planFeatures');
  const offers = buyableModuleOffers(current);
  const opened = addonModulesOf(current);
  const days = current?.packageSnapshot?.durationInDays ?? 0;
  if (!offers.length && !opened.length) return null;
  return (
    <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {t('moduleAddonsTitle')}
      </h4>
      {opened.length > 0 && (
        <p className="mb-2 text-sm text-gray-800 dark:text-gray-200">
          {t('openedModules', { modules: opened.map((k) => moduleName(tm, k)).join(', ') })}
        </p>
      )}
      {offers.length > 0 && (
        <>
          <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
            {offers.map((o) => (
              <li key={o.key}>
                {o.price != null
                  ? t('moduleOffer', {
                      module: moduleName(tm, o.key),
                      price: fmtMoney(o.price),
                      days,
                    })
                  : t('moduleNoPrice', { module: moduleName(tm, o.key) })}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('moduleAddonsHelp')}</p>
        </>
      )}
    </div>
  );
}

// The add-on prices that apply to the school, and the add-ons it has. Extras
// are added by the platform admin; nothing is bought from this screen.
function PlanAddons({ current }) {
  const t = useTranslations('billing');
  const tm = useTranslations('planFeatures');
  const priced = pricedAddons(current?.addonPrices);
  const addons = current?.addons ?? [];
  const days = current?.packageSnapshot?.durationInDays;
  if (!priced.length && !addons.length) return null;
  return (
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      {addons.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('activeAddonsTitle')}
          </h4>
          <ul className="space-y-1.5 text-sm">
            {addons.map((a) => (
              <li key={a._id} className="text-gray-800 dark:text-gray-200">
                {isModuleAddon(a)
                  ? t('moduleAddonLine', {
                      module: moduleName(tm, a.module),
                      price: fmtMoney(a.unitPrice),
                    })
                  : t('addonLine', {
                      quantity: a.quantity,
                      unit: t.has(`units.${a.resource}`)
                        ? t(`units.${a.resource}`, { count: a.quantity })
                        : a.resource,
                      price: fmtMoney(a.unitPrice),
                    })}
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {t('addonAdded', { date: fmtDate(a.addedAt) })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {priced.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('addonPricesTitle')}
          </h4>
          <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
            {priced.map((p) => (
              <li key={p.key}>
                {t('addonPriceLine', {
                  unit: t(`units.${p.key}`, { count: 1 }),
                  price: fmtMoney(p.price),
                  days: days ?? 0,
                })}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('addonPricesHelp')}</p>
        </div>
      )}
    </div>
  );
}

// Overdue (read-only) or due-soon notice for the plan's unpaid invoice. The
// guard's overlay steps aside on this screen, so this is where it is explained.
function PaymentDueNotice() {
  const t = useTranslations('subscriptionGuard');
  const guard = useSubscriptionGuard();
  const dueSoon = paymentDueSoon(guard);
  if (guard.state !== 'unpaid' && !dueSoon) return null;
  const overdue = guard.state === 'unpaid';
  const cls = overdue
    ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400'
    : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
  return (
    <div
      role="alert"
      className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${cls}`}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div>
        {overdue && <p className="font-semibold">{t('unpaidTitle')}</p>}
        <p>
          {overdue
            ? guard.paymentDueAt
              ? t('unpaidBody', { date: fmtDate(guard.paymentDueAt) })
              : t('unpaidBodyNoDate')
            : t('dueSoonBanner', { date: fmtDate(dueSoon) })}{' '}
          {overdue ? t('payHint') : t('dueSoonHint')}
        </p>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const t = useTranslations('subscriptionGuard');
  const tb = useTranslations('billing');
  const { data: currentData, isLoading: currentLoading } = useMyCurrentSubscription();
  const current = currentData?.data ?? null;

  const { data: summaryData } = useMyInvoiceSummary();
  const dues = summaryData?.data ?? null;

  const { data: invoicesData, isLoading: invoicesLoading } = useMyInvoices();
  const invoices = invoicesData?.data ?? [];

  const [historyPage, setHistoryPage] = useState(1);
  const { data: historyData, isLoading: historyLoading } = useMySubscriptionHistory({
    page: historyPage,
    limit: HISTORY_PAGE_SIZE,
  });
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
        render: (v) => (
          <span className="text-gray-700 dark:text-gray-300">
            {tb.has(`invoiceTypes.${v}`) ? tb(`invoiceTypes.${v}`) : v}
          </span>
        ),
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
    [tb],
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

        <PaymentDueNotice />

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
                <PriceLockNote current={current} />
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
                {current.paymentDueAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('paymentDue')}: {fmtDate(current.paymentDueAt)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {ADDON_KEYS.map((key) => {
                  const extra = addonUnits(current, key);
                  return (
                    <LimitStat
                      key={key}
                      label={LIMIT_LABELS[key]}
                      value={effectiveLimit(current, key)}
                      breakdown={
                        extra > 0
                          ? tb('limitWithAddon', { base: baseLimit(current, key) ?? 0, extra })
                          : null
                      }
                    />
                  );
                })}
              </div>

              <StorageCard storage={current.storage} />

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

              <PlanAddons current={current} />
              <ModuleAddons current={current} />
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
          {!historyLoading && history.length > 0 && (
            <HistoryPager
              page={historyPage}
              shown={history.length}
              total={historyData?.total}
              onPage={setHistoryPage}
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
