'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Eye, Plus, AlertTriangle, X } from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { useTokenStore } from '@/store/tokenStore';
import {
  admissionPermissions,
  ENQUIRY_STATUSES,
  GRADE_OPTIONS,
  SOURCES,
  buildEnquiryListParams,
  followUpState,
  gradeLabel,
  sourceLabel,
  statusLabel,
} from '@/utils/admission';
import {
  BranchSelect,
  StaffSelect,
  StatusBadge,
  Spinner,
  cardCls,
  fmtDate,
  inputCls,
  labelCls,
  primaryBtn,
  secondaryBtn,
} from './admissionShared';
import { yearOptions } from './OverviewPanel';
import EnquiryFormModal from './EnquiryFormModal';
import EnquiryDetailModal from './EnquiryDetailModal';

const EMPTY = {
  branchId: '',
  status: '',
  source: '',
  desiredGrade: '',
  academicYear: '',
  assignedTo: '',
  followUpDue: '',
  from: '',
  to: '',
  search: '',
};

const COLUMNS = [
  'enquiryNumber',
  'child',
  'desiredGrade',
  'guardian',
  'source',
  'status',
  'nextFollowUpDate',
  'assignedTo',
];

const DUE_TONE = {
  overdue: 'text-red-600 dark:text-red-400 font-semibold',
  today: 'text-amber-600 dark:text-amber-400 font-semibold',
  upcoming: 'text-gray-700 dark:text-gray-300',
};

export default function EnquiriesPanel({ role, orgTier, userBranchId }) {
  const { accessToken: token } = useTokenStore();
  const [filters, setFilters] = useState(EMPTY);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [detailId, setDetailId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const canCreate = admissionPermissions(role).canManageAny;

  const setFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  // Debounce the free-text search.
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const params = useMemo(() => buildEnquiryListParams(filters), [filters]);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admission-enquiries', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/admission/enquiries', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;
  const today = localYMD();

  const columns = [
    {
      header: 'Enquiry #',
      accessor: 'enquiryNumber',
      render: (v) => (
        <span className="text-sm font-mono text-gray-900 dark:text-gray-100">{v || '—'}</span>
      ),
    },
    {
      header: 'Child',
      accessor: 'child',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {r.child?.name || '—'}
          </div>
          {r.academicYear && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{r.academicYear}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Grade',
      accessor: 'desiredGrade',
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{gradeLabel(v)}</span>
      ),
    },
    {
      header: 'Guardian',
      accessor: 'guardian',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {r.guardian?.name || '—'}
            {r.guardian?.relation && (
              <span className="text-xs text-gray-500 capitalize"> ({r.guardian.relation})</span>
            )}
          </div>
          {r.guardian?.phone && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{r.guardian.phone}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Source',
      accessor: 'source',
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{sourceLabel(v)}</span>
      ),
    },
    { header: 'Status', accessor: 'status', render: (v) => <StatusBadge status={v} /> },
    {
      header: 'Next follow-up',
      accessor: 'nextFollowUpDate',
      render: (v, r) => {
        const state = followUpState(r, today);
        return (
          <span className={`text-sm ${DUE_TONE[state] || 'text-gray-400'}`}>
            {v ? fmtDate(v) : '—'}
            {state === 'overdue' && ' · overdue'}
            {state === 'today' && ' · today'}
          </span>
        );
      },
    },
    {
      header: 'Assigned',
      accessor: 'assignedTo',
      render: (_, r) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{r.assignedToName || '—'}</span>
      ),
    },
  ];

  const rowActions = () => [{ value: 'view', label: 'View Details', icon: Eye }];
  const onRowAction = (value, r) => {
    if (value === 'view') setDetailId(r._id);
  };

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
          <div className="flex-1">
            <label className={labelCls}>Search</label>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Child, guardian, phone or enquiry #"
              className={inputCls}
            />
          </div>
          {canCreate && (
            <button type="button" className={primaryBtn} onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New enquiry
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {orgTier && (
            <div>
              <label className={labelCls}>Branch</label>
              <BranchSelect
                value={filters.branchId}
                onChange={(v) => setFilter({ branchId: v, assignedTo: '' })}
                allLabel="All branches"
              />
            </div>
          )}
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilter({ status: e.target.value })}
              className={inputCls}
            >
              <option value="">All statuses</option>
              {ENQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilter({ source: e.target.value })}
              className={inputCls}
            >
              <option value="">All sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {sourceLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Grade</label>
            <select
              value={filters.desiredGrade}
              onChange={(e) => setFilter({ desiredGrade: e.target.value })}
              className={inputCls}
            >
              <option value="">All grades</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Academic year</label>
            <select
              value={filters.academicYear}
              onChange={(e) => setFilter({ academicYear: e.target.value })}
              className={inputCls}
            >
              <option value="">All years</option>
              {yearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Assigned to</label>
            <StaffSelect
              value={filters.assignedTo}
              onChange={(v) => setFilter({ assignedTo: v })}
              branchId={orgTier ? filters.branchId : userBranchId}
              placeholder="Anyone"
            />
          </div>
          <div>
            <label className={labelCls}>Follow-up due</label>
            <select
              value={filters.followUpDue}
              onChange={(e) => setFilter({ followUpDue: e.target.value })}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="today">Due today</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>From</label>
              <input
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => setFilter({ from: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>To</label>
              <input
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => setFilter({ to: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFilters(EMPTY);
              setSearchInput('');
              setPage(1);
            }}
            className={`${secondaryBtn} mt-3`}
          >
            <X className="w-4 h-4" />
            Reset filters
          </button>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <ul className="flex-1 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setWarnings([])} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error ? (
        <QueryErrorState error={error} fallback="Could not load enquiries" />
      ) : isLoading ? (
        <div className={cardCls}>
          <Spinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={COLUMNS}
          rowActions={rowActions}
          onRowAction={onRowAction}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      {createOpen && (
        <EnquiryFormModal
          orgTier={orgTier}
          userBranchId={userBranchId}
          onClose={() => setCreateOpen(false)}
          onSaved={(saved, w) => {
            setWarnings(w);
            if (saved?._id) setDetailId(saved._id);
          }}
        />
      )}
      <EnquiryDetailModal
        enquiryId={detailId}
        role={role}
        userBranchId={userBranchId}
        orgTier={orgTier}
        onClose={() => setDetailId(null)}
        onWarnings={setWarnings}
      />
    </div>
  );
}
