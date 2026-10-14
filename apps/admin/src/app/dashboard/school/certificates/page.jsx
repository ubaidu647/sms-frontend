'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Eye, Printer, Ban, Plus, X, Search } from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { canActInBranch, canEditScope, resolveScope } from '@/utils/permissions';
import {
  CERTIFICATE_STATUSES,
  CERTIFICATE_TYPES,
  buildCertificateListParams,
  certificateRowActions,
  formatCertDate,
} from '@/utils/certificateText';
import IssueCertificateModal from './IssueCertificateModal';
import CancelCertificateModal from './CancelCertificateModal';
import {
  BranchSelect,
  StatusBadge,
  typeLabel,
  inputCls,
  labelCls,
  cardCls,
  primaryBtn,
  secondaryBtn,
  PRINT_PATH,
} from './certificateShared';

const EMPTY = { type: '', status: '', branchId: '', from: '', to: '', search: '' };

const ACTION_META = {
  view: { label: 'View', icon: Eye },
  print: { label: 'Print', icon: Printer },
  cancel: { label: 'Cancel', icon: Ban, danger: true },
};

const COLUMNS = ['serialNumber', 'type', 'student', 'class', 'issuedAt', 'issuedByName', 'status'];

// Rows may carry the snapshot nested or flattened ('snapshot.studentName').
const snap = (r, key) => r?.snapshot?.[key] ?? r?.[`snapshot.${key}`] ?? '';

export default function CertificatesPage() {
  const router = useRouter();
  const t = useTranslations('certificates');
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const role = user?.role;
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const viewScope = resolveScope(role, 'view-certificate');
  const issueScope = resolveScope(role, 'issue-certificate');
  const canView = viewScope !== 'none' || issueScope !== 'none';
  const canIssue = canEditScope(role, 'issue-certificate');
  const orgTier = viewScope === 'all' || issueScope === 'all';

  const [filters, setFilters] = useState(EMPTY);
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [issueOpen, setIssueOpen] = useState(false);
  const [cancelRow, setCancelRow] = useState(null);

  const setFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  // Debounce the free-text search.
  useEffect(() => {
    if (searchDraft === filters.search) return undefined;
    const id = setTimeout(() => setFilter({ search: searchDraft }), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const params = useMemo(() => buildCertificateListParams(filters), [filters]);
  const { data, isLoading, error } = useQuery({
    queryKey: ['certificates', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/certificates', page, limit, token, ...params }),
    enabled: !!token && canView,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const columns = [
    {
      header: 'Serial No.',
      accessor: 'serialNumber',
      render: (v) => (
        <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
          {v || '—'}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{typeLabel(v)}</span>
      ),
    },
    {
      header: 'Student',
      accessor: 'student',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {snap(r, 'studentName') || '—'}
          </div>
          {snap(r, 'admissionNumber') && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {snap(r, 'admissionNumber')}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Class',
      accessor: 'class',
      render: (_, r) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {[snap(r, 'className'), snap(r, 'sectionName')].filter(Boolean).join(' - ') || '—'}
        </span>
      ),
    },
    {
      header: 'Issued on',
      accessor: 'issuedAt',
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatCertDate(v, { local: true }) || '—'}
        </span>
      ),
    },
    {
      header: 'Issued by',
      accessor: 'issuedByName',
      render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300">{v || '—'}</span>,
    },
    { header: 'Status', accessor: 'status', render: (v) => <StatusBadge status={v} /> },
  ];

  const rowActions = (r) =>
    certificateRowActions(r, {
      canIssue: r.branchId
        ? canActInBranch(role, 'issue-certificate', userBranchId, r.branchId)
        : canIssue,
    }).map((value) => ({ value, ...ACTION_META[value] }));

  const onRowAction = (value, r) => {
    if (value === 'view') router.push(PRINT_PATH(r._id));
    else if (value === 'print') router.push(`${PRINT_PATH(r._id)}?print=1`);
    else if (value === 'cancel') setCancelRow(r);
  };

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY) || searchDraft;

  if (!canView) {
    return (
      <div className="md:flex-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-3xl mx-auto text-center py-16 text-gray-600 dark:text-gray-400">
          You do not have permission to view certificates.
        </div>
      </div>
    );
  }

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </div>
          {canIssue && (
            <button type="button" onClick={() => setIssueOpen(true)} className={primaryBtn}>
              <Plus className="w-4 h-4" />
              Issue certificate
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className={cardCls}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <label className={labelCls}>Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    placeholder="Serial, student name or admission #"
                    className={`${inputCls} ps-9`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilter({ type: e.target.value })}
                  className={inputCls}
                >
                  <option value="">All types</option>
                  {CERTIFICATE_TYPES.map((ty) => (
                    <option key={ty} value={ty}>
                      {typeLabel(ty)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilter({ status: e.target.value })}
                  className={`${inputCls} capitalize`}
                >
                  <option value="">All statuses</option>
                  {CERTIFICATE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {orgTier && (
                <div>
                  <label className={labelCls}>Branch</label>
                  <BranchSelect
                    value={filters.branchId}
                    onChange={(v) => setFilter({ branchId: v })}
                    allLabel="All branches"
                  />
                </div>
              )}
              <div>
                <label className={labelCls}>Issued from</label>
                <input
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  onChange={(e) => setFilter({ from: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Issued to</label>
                <input
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  onChange={(e) => setFilter({ to: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY);
                  setSearchDraft('');
                  setPage(1);
                }}
                className={`${secondaryBtn} mt-3`}
              >
                <X className="w-4 h-4" />
                Reset filters
              </button>
            )}
          </div>

          {error ? (
            <QueryErrorState error={error} fallback="Could not load certificates" />
          ) : isLoading ? (
            <div className={`${cardCls} p-12 flex justify-center`}>
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
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
        </div>

        <IssueCertificateModal isOpen={issueOpen} onClose={() => setIssueOpen(false)} />
        {cancelRow && (
          <CancelCertificateModal certificate={cancelRow} onClose={() => setCancelRow(null)} />
        )}
      </div>
    </div>
  );
}
