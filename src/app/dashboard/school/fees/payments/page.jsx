'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import { Search, Eye, Ban } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import VoidPaymentModal from './VoidPaymentModal';
import PaymentDetailModal from './PaymentDetailModal';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_COLORS,
  formatDate,
  formatMoney,
} from '@/constants/fee';

export default function PaymentsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const [voidTarget, setVoidTarget] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isVoid, setIsVoid] = useState('false');
  const [branchId, setBranchId] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const scope = resolveScope(user?.role, 'view-payment');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const canVoid =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['void-payment', 'void-all-branch-payment']);
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const queryKey = [
    'payments',
    page,
    limit,
    method,
    fromDate,
    toDate,
    isVoid,
    branchId,
    isOrgLevel,
    userBranchId,
  ];

  const { data } = useQuery({
    queryKey,
    queryFn: () => {
      const params = {};
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (branchId) params.branchId = branchId;
      if (method) params.method = method;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (isVoid !== '') params.isVoid = isVoid === 'true';
      return fetchData({ url: '/fee/payment/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const list = data?.data || [];
  const filtered = search
    ? list.filter(
        (p) =>
          p.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
          p.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.voucher?.voucherNumber?.toLowerCase().includes(search.toLowerCase()),
      )
    : list;
  const resetPage = () => setPage(1);

  const columns = useMemo(
    () => [
      {
        header: 'Receipt #',
        accessor: 'receiptNumber',
        render: (v, row) => (
          <div>
            <div className="font-mono text-sm text-gray-900">{v}</div>
            <div className="text-xs text-gray-400">{formatDate(row.paymentDate)}</div>
          </div>
        ),
      },
      {
        header: 'Student',
        accessor: 'student',
        render: (s) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{s?.user?.name || '—'}</div>
            <div className="text-xs text-gray-500">
              {s?.admissionNumber} · Roll {s?.rollNumber}
            </div>
          </div>
        ),
      },
      {
        header: 'Voucher',
        accessor: 'voucher',
        render: (v) => (
          <div className="text-sm">
            <div className="text-gray-900">{v?.voucherNumber || '—'}</div>
            <div className="text-xs text-gray-500">{v?.month}</div>
          </div>
        ),
      },
      {
        header: 'Method',
        accessor: 'method',
        render: (m) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              PAYMENT_METHOD_COLORS[m] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {m}
          </span>
        ),
      },
      {
        header: 'Amount',
        accessor: 'amount',
        render: (v, row) => (
          <span
            className={`text-sm font-medium ${row.isVoid ? 'line-through text-gray-400' : 'text-gray-900'}`}
          >
            {formatMoney(v)}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'isVoid',
        render: (v) =>
          v ? (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Void
            </span>
          ) : (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Active
            </span>
          ),
      },
    ],
    [],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View Detail', value: 'view', icon: Eye }];
    if (canVoid && !row.isVoid)
      items.push({ label: 'Void', value: 'void', icon: Ban });
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'view') setDetailId(row._id);
    if (action === 'void') setVoidTarget(row);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">
              Recorded fee payments &amp; receipts. Void here if a cheque bounces or a refund is
              needed.
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search receipt / student / voucher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="outline-none text-sm w-72 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              resetPage();
            }}
            placeholder="From"
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              resetPage();
            }}
            placeholder="To"
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none"
          />

          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={isVoid}
            onChange={(e) => {
              setIsVoid(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="false">Active Only</option>
            <option value="true">Voided Only</option>
            <option value="">All</option>
          </select>

          {isOrgLevel && (
            <select
              value={branchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => {
                setBranchId(e.target.value);
                resetPage();
              }}
              className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Table
          columns={columns}
          data={filtered}
          rowActions={rowActions}
          onRowAction={handleRowAction}
          showImage={false}
          visibleColumns={visibleColumns}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={data?.total}
        />

        <PaymentDetailModal
          isOpen={!!detailId}
          onClose={() => setDetailId(null)}
          paymentId={detailId}
        />
        <VoidPaymentModal
          isOpen={!!voidTarget}
          onClose={() => setVoidTarget(null)}
          payment={voidTarget}
        />
      </div>
    </div>
  );
}
