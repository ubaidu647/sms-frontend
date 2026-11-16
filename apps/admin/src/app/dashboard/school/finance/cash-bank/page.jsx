'use client';
import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Plus, Repeat, Wallet, Landmark, Ban } from 'lucide-react';
import { Table } from '@/component/Table';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { formatDate, formatMoney } from '@/constants/accounting';
import {
  filterCls,
  useBranches,
  useFinanceAccess,
  useMoneyAccounts,
} from '../_components/financeShared';
import EntryFormModal from '../_components/EntryFormModal';
import VoidEntryModal from '../_components/VoidEntryModal';
import MoneyAccountFormModal from './MoneyAccountFormModal';

function SummaryCard({ icon: Icon, label, amount, tone }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {formatMoney(amount)}
        </div>
      </div>
    </div>
  );
}

export default function CashBankPage() {
  const { accessToken: token } = useTokenStore();
  const { user, canManage, isOrgLevel, userBranchId } = useFinanceAccess();

  const [branchId, setBranchId] = useState('');
  const [branchTouched, setBranchTouched] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;
  const branches = useBranches(isOrgLevel && branchTouched);
  const { accounts, totalCash, totalBank } = useMoneyAccounts(effectiveBranchId, !!user);

  const { data: movesData } = useQuery({
    queryKey: ['finance-entries', 'transfer', page, limit, effectiveBranchId],
    queryFn: () =>
      fetchData({
        url: '/finance/entries',
        page,
        limit,
        token,
        kind: 'transfer',
        branchId: effectiveBranchId || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const accountColumns = useMemo(
    () => [
      {
        header: 'Account',
        accessor: 'name',
        render: (v, row) => (
          <div className="flex items-center gap-2">
            {row.category === 'cash' ? (
              <Wallet className="w-4 h-4 text-amber-600" />
            ) : (
              <Landmark className="w-4 h-4 text-sky-600" />
            )}
            <span className="font-medium text-gray-900 dark:text-gray-100">{v}</span>
          </div>
        ),
      },
      {
        header: 'Type',
        accessor: 'category',
        render: (v) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {v === 'cash' ? 'Cash box' : 'Bank'}
          </span>
        ),
      },
      {
        header: 'Used by',
        accessor: 'allBranches',
        render: (v) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {v ? 'All branches' : 'One branch'}
          </span>
        ),
      },
      {
        header: 'Balance',
        accessor: 'balance',
        render: (v) => (
          <span
            className={`text-sm font-semibold ${
              v < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {formatMoney(v)}
          </span>
        ),
      },
    ],
    [],
  );

  const moveColumns = useMemo(
    () => [
      {
        header: 'Entry',
        accessor: 'serialNumber',
        render: (v) => <span className="font-medium text-gray-900 dark:text-gray-100">{v}</span>,
      },
      {
        header: 'Date',
        accessor: 'date',
        render: (v) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(v)}</span>
        ),
      },
      {
        header: 'From → To',
        accessor: 'cashBankAccountName',
        render: (v, row) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {v || '—'} → {row.toAccountName || '—'}
          </span>
        ),
      },
      {
        header: 'Amount',
        accessor: 'amount',
        render: (v, row) => (
          <span
            className={`text-sm font-medium ${
              row.status === 'void'
                ? 'line-through text-gray-400'
                : 'text-indigo-700 dark:text-indigo-400'
            }`}
          >
            {formatMoney(v)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Cash &amp; Bank
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              What is in each cash box and bank account, after every fee, salary, expense and
              transfer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            {isOrgLevel && (
              <select
                value={branchId}
                onFocus={() => setBranchTouched(true)}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setPage(1);
                }}
                className={filterCls}
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            {canManage && (
              <>
                <button
                  onClick={() => setTransferOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                >
                  <Repeat className="w-4 h-4" />
                  Transfer
                </button>
                <button
                  onClick={() => setAccountOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New account
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            icon={Wallet}
            label="Cash in hand"
            amount={totalCash}
            tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          />
          <SummaryCard
            icon={Landmark}
            label="In the bank"
            amount={totalBank}
            tone="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
          />
          <SummaryCard
            icon={Repeat}
            label="Total"
            amount={Math.round((totalCash + totalBank) * 100) / 100}
            tone="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
          />
        </div>

        <Table
          columns={accountColumns}
          data={accounts}
          rowActions={[]}
          showImage={false}
          visibleColumns={accountColumns.map((c) => c.accessor)}
          page={1}
          limit={Math.max(accounts.length, 10)}
          totalItems={accounts.length}
        />

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Transfers</h2>
          <Table
            columns={moveColumns}
            data={movesData?.data || []}
            rowActions={(row) =>
              canManage && row.status === 'posted'
                ? [{ label: 'Void', value: 'void', icon: Ban }]
                : []
            }
            onRowAction={(action, row) => action === 'void' && setVoidTarget(row)}
            showImage={false}
            visibleColumns={moveColumns.map((c) => c.accessor)}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            totalItems={movesData?.total}
          />
        </div>

        <MoneyAccountFormModal
          isOpen={accountOpen}
          onClose={() => setAccountOpen(false)}
          branchId={effectiveBranchId}
        />
        <EntryFormModal
          isOpen={transferOpen}
          onClose={() => setTransferOpen(false)}
          kind="transfer"
          branchId={effectiveBranchId}
        />
        <VoidEntryModal
          isOpen={!!voidTarget}
          onClose={() => setVoidTarget(null)}
          entry={voidTarget}
        />
      </div>
    </div>
  );
}
