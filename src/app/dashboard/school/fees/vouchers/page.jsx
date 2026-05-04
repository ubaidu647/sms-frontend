'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table } from '@/component/Table';
import {
  Plus,
  Search,
  Eye,
  AlertOctagon,
  Ban,
  Wallet,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import {
  useQuery,
  keepPreviousData,
} from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import GenerateSectionModal from './GenerateSectionModal';
import GenerateStudentModal from './GenerateStudentModal';
import VoidVoucherModal from './VoidVoucherModal';
import LateFeeModal from './LateFeeModal';
import RegenerateVoucherModal from './RegenerateVoucherModal';
import RegenerateSectionModal from './RegenerateSectionModal';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import {
  VOUCHER_STATUSES,
  VOUCHER_STATUS_COLORS,
  currentAcademicYear,
  formatDate,
  formatMoney,
  formatMonth,
} from '@/constants/fee';

export default function VouchersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const [genSectionOpen, setGenSectionOpen] = useState(false);
  const [genStudentOpen, setGenStudentOpen] = useState(false);
  const [regenSectionOpen, setRegenSectionOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);
  const [lateFeeTarget, setLateFeeTarget] = useState(null);
  const [regenTarget, setRegenTarget] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const initialStudentId = searchParams.get('studentId') || '';
  const initialAcademicYear = searchParams.has('academicYear')
    ? searchParams.get('academicYear') || ''
    : initialStudentId
      ? ''
      : currentAcademicYear();
  const [classId, setClassId] = useState(searchParams.get('classId') || '');
  const [sectionId, setSectionId] = useState(searchParams.get('sectionId') || '');
  const [month, setMonth] = useState(searchParams.get('month') || '');
  const [academicYear, setAcademicYear] = useState(initialAcademicYear);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [branchId, setBranchId] = useState(searchParams.get('branchId') || '');
  const [studentId, setStudentId] = useState(initialStudentId);
  const [studentLabel, setStudentLabel] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const scope = resolveScope(user?.role, 'view-fee');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const canGenerate =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['generate-voucher', 'generate-all-branch-voucher']);
  const canRecordPayment =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['record-payment', 'record-all-branch-payment']);
  const canUpdate =
    !isOwnOnly && hasAnyAction(user?.role, ['update-fee', 'update-all-branch-fee']);
  const canDelete =
    !isOwnOnly && hasAnyAction(user?.role, ['delete-fee', 'delete-all-branch-fee']);
  const userBranchId = user?.branchId || user?.branch?._id || '';
  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: classData } = useQuery({
    queryKey: ['classes-vouchers', effectiveBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        academicYear,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token && !!academicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['sections-vouchers', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  const queryKey = [
    'vouchers',
    page,
    limit,
    classId,
    sectionId,
    month,
    academicYear,
    status,
    branchId,
    studentId,
    isOrgLevel,
    userBranchId,
  ];

  const { data } = useQuery({
    queryKey,
    queryFn: () => {
      const params = {};
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (branchId) params.branchId = branchId;
      if (classId) params.classId = classId;
      if (sectionId) params.sectionId = sectionId;
      if (month) params.month = month;
      if (academicYear) params.academicYear = academicYear;
      if (status) params.status = status;
      if (studentId) params.studentId = studentId;
      return fetchData({ url: '/fee/voucher/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const list = data?.data || [];
  const filtered = search
    ? list.filter(
        (v) =>
          v.voucherNumber?.toLowerCase().includes(search.toLowerCase()) ||
          v.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          v.student?.admissionNumber?.toLowerCase().includes(search.toLowerCase()),
      )
    : list;
  const resetPage = () => setPage(1);

  useEffect(() => {
    if (studentId && !studentLabel && list.length > 0) {
      const first = list.find((v) => (v.studentId?._id || v.studentId) === studentId) || list[0];
      const s = first?.student;
      if (s) {
        setStudentLabel(`${s.user?.name || 'Student'}${s.admissionNumber ? ` · ${s.admissionNumber}` : ''}`);
      }
    }
  }, [studentId, studentLabel, list]);

  const clearStudentFilter = () => {
    setStudentId('');
    setStudentLabel('');
    resetPage();
  };

  const columns = useMemo(
    () => [
      {
        header: 'Voucher',
        accessor: 'voucherNumber',
        render: (v, row) => (
          <div>
            <div className="font-medium text-gray-900">{v}</div>
            <div className="text-xs text-gray-400">{formatMonth(row.month)}</div>
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
        header: 'Class / Section',
        accessor: 'class',
        render: (c, row) => (
          <div className="text-sm text-gray-700">
            {c?.name ?? '—'}
            {row.section?.name && <span className="text-gray-400"> · {row.section.name}</span>}
          </div>
        ),
      },
      {
        header: 'Total',
        accessor: 'totalAmount',
        render: (v) => <span className="text-sm text-gray-700">{formatMoney(v)}</span>,
      },
      {
        header: 'Paid',
        accessor: 'paidAmount',
        render: (v) => <span className="text-sm text-green-700">{formatMoney(v)}</span>,
      },
      {
        header: 'Balance',
        accessor: 'balanceAmount',
        render: (v) => (
          <span className={`text-sm font-medium ${v > 0 ? 'text-red-700' : 'text-gray-500'}`}>
            {formatMoney(v)}
          </span>
        ),
      },
      {
        header: 'Due',
        accessor: 'dueDate',
        render: (v) => <span className="text-xs text-gray-600">{formatDate(v)}</span>,
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              VOUCHER_STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {v}
          </span>
        ),
      },
    ],
    [],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View / Print', value: 'view', icon: Eye }];
    const isFinal = row.status === 'paid' || row.status === 'void';
    if (canRecordPayment && row.balanceAmount > 0 && row.status !== 'void')
      items.push({ label: 'Record Payment', value: 'pay', icon: Wallet });
    if (canUpdate && !isFinal)
      items.push({ label: 'Set Late Fee', value: 'late-fee', icon: AlertOctagon });
    if (canGenerate && row.status !== 'void' && (row.paidAmount || 0) === 0)
      items.push({ label: 'Regenerate', value: 'regenerate', icon: RefreshCw });
    if (canDelete && row.status !== 'void' && row.status !== 'paid')
      items.push({ label: 'Void', value: 'void', icon: Ban });
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'view') router.push(`/dashboard/school/fees/vouchers/${row._id}`);
    if (action === 'pay') setPaymentTarget(row);
    if (action === 'late-fee') setLateFeeTarget(row);
    if (action === 'regenerate') setRegenTarget(row);
    if (action === 'void') setVoidTarget(row);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vouchers</h1>
            <p className="text-gray-600 mt-1">
              Monthly fee vouchers — generated, paid, and tracked.
            </p>
          </div>
          <div className="flex gap-2">
            {canGenerate && (
              <button
                onClick={() => setGenStudentOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Single Student
              </button>
            )}
            {canGenerate && (
              <button
                onClick={() => setRegenSectionOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate Section
              </button>
            )}
            {canGenerate && (
              <button
                onClick={() => setGenSectionOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Generate Section
              </button>
            )}
          </div>
        </div>

        {studentId && (
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-sm text-teal-800">
              Student: <strong>{studentLabel || studentId}</strong>
              <button
                onClick={clearStudentFilter}
                className="ml-1 text-teal-700 hover:text-teal-900 text-xs"
                type="button"
                title="Clear student filter"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search voucher / student..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="outline-none text-sm w-64 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <input
            type="text"
            placeholder="2025-2026"
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 w-32 outline-none"
          />

          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none"
          />

          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId('');
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.grade ? `(Gr ${c.grade})` : ''}
              </option>
            ))}
          </select>

          <select
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              resetPage();
            }}
            disabled={!classId}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">{classId ? 'All Sections' : 'Pick class'}</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 capitalize"
          >
            <option value="">All Status</option>
            {VOUCHER_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
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

        <GenerateSectionModal isOpen={genSectionOpen} onClose={() => setGenSectionOpen(false)} />
        <GenerateStudentModal isOpen={genStudentOpen} onClose={() => setGenStudentOpen(false)} />
        <RegenerateSectionModal
          isOpen={regenSectionOpen}
          onClose={() => setRegenSectionOpen(false)}
        />
        <VoidVoucherModal
          isOpen={!!voidTarget}
          onClose={() => setVoidTarget(null)}
          voucher={voidTarget}
        />
        <LateFeeModal
          isOpen={!!lateFeeTarget}
          onClose={() => setLateFeeTarget(null)}
          voucher={lateFeeTarget}
        />
        <RegenerateVoucherModal
          isOpen={!!regenTarget}
          onClose={() => setRegenTarget(null)}
          voucher={regenTarget}
        />
        <RecordPaymentModal
          isOpen={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
          voucher={paymentTarget}
        />
      </div>
    </div>
  );
}
