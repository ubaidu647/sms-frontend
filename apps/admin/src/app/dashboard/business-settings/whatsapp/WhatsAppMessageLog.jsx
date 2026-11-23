'use client';
import React, { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  History,
  Building2,
  RefreshCw,
  Search,
  Phone,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import QueryErrorState from '@/component/QueryErrorState';
import ReportPagination from '@/component/ReportPagination';
import { canSee, isOrgLevel as isOrgLevelScope } from '@/utils/permissions';
import { ACTIONS } from '@/constants/rolePermissions';
import { getMessageLog } from '@/services/whatsapp';
import { currentAcademicYear } from '@/constants/fee';

const PAGE_SIZE = 25;
// Pending rows flip to sent once WhatsApp reconnects — keep the list fresh.
const REFRESH_MS = 30_000;

// Order and wording of the state chips. `hint` explains each state to the admin.
const STATES = [
  { id: 'sent', label: 'Sent', hint: 'Delivered to WhatsApp' },
  {
    id: 'pending',
    label: 'Pending',
    hint: 'WhatsApp was disconnected — sent automatically once it reconnects (same day only)',
  },
  { id: 'queued', label: 'Sending', hint: 'In the send queue right now' },
  { id: 'failed', label: 'Failed', hint: 'Not delivered — see the reason' },
  {
    id: 'skipped',
    label: 'Skipped',
    hint: 'Held back by the safety limits (working hours, daily cap)',
  },
];

const BADGE = {
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/60',
  pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/60',
  queued:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/60',
  failed:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/60',
  skipped:
    'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

const ATTENDANCE_STATUSES = [
  { id: 'absent', label: 'Absent' },
  { id: 'late', label: 'Late' },
  { id: 'present', label: 'Present' },
  { id: 'leave', label: 'Leave' },
  { id: 'half-day', label: 'Half-day' },
  { id: 'holiday', label: 'Holiday' },
];

const EMPTY_FILTERS = {
  branchId: '',
  classId: '',
  sectionId: '',
  state: '',
  status: '',
  provider: '',
  dateBy: 'raised',
  from: '',
  to: '',
  sort: 'newest',
};

const stateMeta = (id) => STATES.find((s) => s.id === id) || { id, label: id, hint: '' };

const fmtDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};

const fmtPhone = (n) => (n ? `+${n}` : '—');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

function StateBadge({ state }) {
  const meta = stateMeta(state);
  return (
    <span
      title={meta.hint}
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${
        BADGE[state] || BADGE.skipped
      }`}
    >
      {meta.label}
    </span>
  );
}

// One message: summary line, and the full text + reason when expanded.
function MessageRow({ row, showBranch }) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-start gap-3"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-x-3 gap-y-1 items-center">
          <div className="sm:col-span-3 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {row.student?.name || 'Unknown student'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {row.student?.admissionNumber ? `${row.student.admissionNumber} · ` : ''}
              {cap(row.status)}
              {showBranch && row.branch?.name ? ` · ${row.branch.name}` : ''}
            </p>
          </div>
          <div className="sm:col-span-3 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
            {fmtPhone(row.to)}
          </div>
          <div className="sm:col-span-3 text-xs text-gray-500 dark:text-gray-400">
            {fmtDateTime(row.createdAt)}
          </div>
          <div className="sm:col-span-3 flex sm:justify-end">
            <StateBadge state={row.state} />
          </div>
          {!open && row.error && row.state !== 'sent' && (
            <p className="sm:col-span-12 text-xs text-red-600 dark:text-red-400 truncate">
              {row.error}
            </p>
          )}
        </div>
        <Chevron className="w-4 h-4 mt-1 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="mt-3 ml-0 sm:ml-1 space-y-2">
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 px-3 py-2">
            {row.body}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <dt className="inline font-medium">Attendance date: </dt>
              <dd className="inline">
                {row.refDate ? new Date(row.refDate).toISOString().slice(0, 10) : '—'}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Last update: </dt>
              <dd className="inline">{fmtDateTime(row.updatedAt)}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Sent via: </dt>
              <dd className="inline">
                {row.provider === 'official' ? 'Official API' : 'QR (unofficial)'}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Status: </dt>
              <dd className="inline">{stateMeta(row.state).hint}</dd>
            </div>
            {row.error && (
              <div className="sm:col-span-2 text-red-600 dark:text-red-400">
                <dt className="inline font-medium">Reason: </dt>
                <dd className="inline">{row.error}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </li>
  );
}

/**
 * Every WhatsApp message the school raised for parents — sent, waiting for a
 * reconnect, or not delivered and why. Same rights as viewing the settings:
 * org-level viewers pick a branch (or all), branch users see their own.
 */
export default function WhatsAppMessageLog() {
  const { user } = useUserStore();
  const { accessToken: token } = useTokenStore();
  const role = user?.role;
  const canView = canSee(role, ACTIONS.VIEW_WHATSAPP_SETTINGS);
  const isOrgLevel = isOrgLevelScope(role, ACTIONS.VIEW_WHATSAPP_SETTINGS);

  // Every filter in one object; text searches are debounced separately.
  const [f, setF] = useState(EMPTY_FILTERS);
  const set = (key, value) =>
    setF((prev) => {
      const next = { ...prev, [key]: value };
      // a class belongs to a branch and a section to a class
      if (key === 'branchId') {
        next.classId = '';
        next.sectionId = '';
      }
      if (key === 'classId') next.sectionId = '';
      return next;
    });
  const [searchInput, setSearchInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState('');
  const [page, setPage] = useState(1);

  // Debounce the text searches so each keystroke is not a request.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => {
    const t = setTimeout(() => setPhone(phoneInput.trim()), 400);
    return () => clearTimeout(t);
  }, [phoneInput]);

  // Any filter change starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [f, search, phone]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canView && isOrgLevel,
    staleTime: Infinity,
  });
  const branchOptions = branchData?.data || [];

  // Classes of the chosen branch (org-level) or the user's own branch.
  const academicYear = currentAcademicYear();
  const classBranchId = isOrgLevel ? f.branchId : undefined;
  const { data: classData } = useQuery({
    queryKey: ['whatsapp-log-classes', classBranchId || 'all', academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        academicYear,
        branchId: classBranchId || undefined,
      }),
    enabled: !!token && canView,
    staleTime: 60_000,
  });
  const classOptions = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['whatsapp-log-sections', f.classId],
    queryFn: () => fetchData({ url: `/class/${f.classId}/sections`, token }),
    enabled: !!token && canView && !!f.classId,
    staleTime: 60_000,
  });
  const sectionOptions = sectionData?.data || [];

  const params = {
    ...f,
    branchId: isOrgLevel ? f.branchId : undefined,
    search,
    phone,
    page,
    limit: PAGE_SIZE,
  };
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['whatsapp', 'messages', params],
    queryFn: () => getMessageLog(params),
    enabled: canView,
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });

  if (!canView) return null;

  const { state } = f;
  const setState = (v) => set('state', v);
  const rows = data?.data || [];
  const total = data?.total ?? 0;
  const counts = data?.custom?.counts || {};
  const allCount = Object.values(counts).reduce((a, n) => a + (Number(n) || 0), 0);
  // How many filters are on (the default sort/date field do not count).
  const activeCount =
    Object.entries(f).filter(([k, v]) => v && v !== EMPTY_FILTERS[k]).length +
    (search ? 1 : 0) +
    (phone ? 1 : 0);
  const filtered = activeCount > 0;
  const clearAll = () => {
    setF(EMPTY_FILTERS);
    setSearchInput('');
    setPhoneInput('');
    setSearch('');
    setPhone('');
  };

  const input =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50';
  const field = 'flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0';
  const chip = (active) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
      active
        ? 'bg-teal-600 border-teal-600 text-white'
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`;

  return (
    <section className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-wrap">
        <span className="inline-flex w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/40 items-center justify-center text-teal-600 dark:text-teal-300">
          <History className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Message log</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Every WhatsApp message sent to parents — and the ones that did not go, with the reason.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Searches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className={field}>
            Student
            <span className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Name or admission number"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${input} pl-9`}
              />
            </span>
          </label>
          <label className={field}>
            Parent number
            <span className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                inputMode="tel"
                placeholder="e.g. 0300-1234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className={`${input} pl-9`}
              />
            </span>
          </label>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {isOrgLevel && (
            <label className={field}>
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Branch
              </span>
              <select
                value={f.branchId}
                onChange={(e) => set('branchId', e.target.value)}
                className={input}
              >
                <option value="">All branches</option>
                {branchOptions.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name || 'Unnamed branch'}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={field}>
            Class
            <select
              value={f.classId}
              onChange={(e) => set('classId', e.target.value)}
              className={input}
            >
              <option value="">All classes</option>
              {classOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {isOrgLevel && !f.branchId && c.branch?.name ? ` — ${c.branch.name}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            Section
            <select
              value={f.sectionId}
              onChange={(e) => set('sectionId', e.target.value)}
              disabled={!f.classId}
              className={input}
            >
              <option value="">{f.classId ? 'All sections' : 'Pick a class first'}</option>
              {sectionOptions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            Attendance status
            <select
              value={f.status}
              onChange={(e) => set('status', e.target.value)}
              className={input}
            >
              <option value="">Any status</option>
              {ATTENDANCE_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            Sent via
            <select
              value={f.provider}
              onChange={(e) => set('provider', e.target.value)}
              className={input}
            >
              <option value="">Any</option>
              <option value="unofficial">QR (unofficial)</option>
              <option value="official">Official API</option>
            </select>
          </label>
          <label className={field}>
            Date of
            <select
              value={f.dateBy}
              onChange={(e) => set('dateBy', e.target.value)}
              className={input}
            >
              <option value="raised">Message raised</option>
              <option value="attendance">Attendance day</option>
            </select>
          </label>
          <label className={field}>
            From
            <input
              type="date"
              value={f.from}
              max={f.to || undefined}
              onChange={(e) => set('from', e.target.value)}
              className={input}
            />
          </label>
          <label className={field}>
            To
            <input
              type="date"
              value={f.to}
              min={f.from || undefined}
              onChange={(e) => set('to', e.target.value)}
              className={input}
            />
          </label>
          <label className={field}>
            Sort
            <select value={f.sort} onChange={(e) => set('sort', e.target.value)} className={input}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {filtered ? `${activeCount} filter${activeCount === 1 ? '' : 's'} on` : 'No filters'}
          </span>
          {filtered && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-teal-700 dark:text-teal-300 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* State chips with counts (counts ignore the state filter itself) */}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(!state)} onClick={() => setState('')}>
            All <span className="opacity-75">{allCount}</span>
          </button>
          {STATES.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.hint}
              className={chip(state === s.id)}
              onClick={() => setState(state === s.id ? '' : s.id)}
            >
              {s.label} <span className="opacity-75">{counts[s.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {counts.pending > 0 && state !== 'pending' && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {counts.pending} message{counts.pending === 1 ? ' is' : 's are'} waiting for WhatsApp to
            reconnect. They go out automatically once it does — the same day only; after that they
            are marked failed.
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading messages…</div>
        ) : isError ? (
          <QueryErrorState
            error={error}
            fallback="Could not load the message log"
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            {filtered
              ? 'No messages match these filters.'
              : 'No WhatsApp messages yet. They appear here once attendance notifications go out.'}
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-x-3 px-0 pr-7 text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
              <span className="col-span-3">Student</span>
              <span className="col-span-3">Parent number</span>
              <span className="col-span-3">Raised at</span>
              <span className="col-span-3 text-right">State</span>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => (
                <MessageRow key={row._id} row={row} showBranch={isOrgLevel && !f.branchId} />
              ))}
            </ul>
            <ReportPagination
              page={page}
              limit={PAGE_SIZE}
              shown={rows.length}
              total={total}
              onPageChange={setPage}
              noun="messages"
            />
          </>
        )}
      </div>
    </section>
  );
}
