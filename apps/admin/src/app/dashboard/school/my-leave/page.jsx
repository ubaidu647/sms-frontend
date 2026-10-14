'use client';
// Self-service leave for a staff member: balance, apply, own requests.
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Ban, Eye } from 'lucide-react';
import Button from '@/component/Button';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { useUserStore } from '@/store/userStore';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData, patchData, postData } from '@/utils/api';
import { hasAnyAction } from '@/utils/permissions';
import { errorStatus, retryUnless4xx } from '@/utils/queryError';
import { localYMD } from '@/utils/localDate';
import {
  academicYearStartMonth,
  currentAcademicYear,
  previousAcademicYear,
} from '@/utils/academicYear';
import {
  LEAVE_STATUSES,
  REASON_MAX,
  REASON_MIN,
  STAFF_LEAVE_TYPES,
  canCancelOwn,
  countWorkingDays,
  formatLeaveRange,
  validateLeaveDates,
} from '@/utils/leave';
import BalanceTable from '../leave/BalanceTable';
import ConfirmModal from '../leave/ConfirmModal';
import { Modal } from '@/component/Modal';
import {
  PaySplit,
  StatusBadge,
  cardCls,
  errorCls,
  inputCls,
  labelCls,
  leaveTypeLabel,
  invalidateLeaveData,
} from '../leave/leaveShared';

const schema = yup.object({
  leaveType: yup
    .string()
    .oneOf(STAFF_LEAVE_TYPES, 'Pick a leave type')
    .required('Pick a leave type'),
  fromDate: yup.string().required('Start date is required'),
  toDate: yup.string().required('End date is required'),
  reason: yup
    .string()
    .trim()
    .min(REASON_MIN, `At least ${REASON_MIN} characters`)
    .max(REASON_MAX, `At most ${REASON_MAX} characters`)
    .required('Reason is required'),
});

const defaults = () => ({ leaveType: '', fromDate: localYMD(), toDate: localYMD(), reason: '' });

function ApplyForm() {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: defaults() });

  const fromDate = watch('fromDate');
  const toDate = watch('toDate');
  const dateError =
    fromDate && toDate ? validateLeaveDates(fromDate, toDate, academicYearStartMonth()) : '';
  const hint = !dateError ? countWorkingDays(fromDate, toDate) : 0;

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/leave/my', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Leave request submitted');
      invalidateLeaveData(queryClient);
      reset(defaults());
    },
    onError: (err) => {
      setSubmitError(err.message || 'Failed to submit');
      toast.error(err.message || 'Failed to submit');
    },
  });

  const onSubmit = (v) => {
    setSubmitError('');
    if (dateError) {
      setSubmitError(dateError);
      return;
    }
    mutation.mutate({
      leaveType: v.leaveType,
      fromDate: v.fromDate,
      toDate: v.toDate,
      reason: v.reason.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardCls} space-y-4`}>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Apply for leave</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Leave type</label>
          <select {...register('leaveType')} className={inputCls}>
            <option value="">Select type...</option>
            {STAFF_LEAVE_TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {leaveTypeLabel(tp)}
              </option>
            ))}
          </select>
          {errors.leaveType && <p className={errorCls}>{errors.leaveType.message}</p>}
        </div>
        <div>
          <label className={labelCls}>From</label>
          <input type="date" {...register('fromDate')} className={inputCls} />
          {errors.fromDate && <p className={errorCls}>{errors.fromDate.message}</p>}
        </div>
        <div>
          <label className={labelCls}>To</label>
          <input
            type="date"
            {...register('toDate')}
            min={fromDate || undefined}
            className={inputCls}
          />
          {errors.toDate && <p className={errorCls}>{errors.toDate.message}</p>}
        </div>
      </div>
      {dateError ? (
        <p className={errorCls}>{dateError}</p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          About {hint} working day(s) (Mon–Sat estimate — your branch&apos;s working days decide the
          final count). Days beyond your remaining quota are unpaid.
        </p>
      )}
      <div>
        <label className={labelCls}>Reason</label>
        <textarea {...register('reason')} rows={3} maxLength={REASON_MAX} className={inputCls} />
        {errors.reason && <p className={errorCls}>{errors.reason.message}</p>}
      </div>
      {submitError && <p className={errorCls}>{submitError}</p>}
      <div className="flex justify-end">
        <Button
          type="submit"
          label="Submit request"
          loading={mutation.isPending}
          styleObject={{
            baseColor: 'bg-teal-600',
            hoverColor: 'hover:bg-teal-700',
            rounded: 'rounded-lg',
            size: 'px-6 py-2.5 text-sm min-h-[2.5rem]',
            textColor: 'text-white',
          }}
        />
      </div>
    </form>
  );
}

function MyRequests() {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [cancelRow, setCancelRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['leave-my', 'requests', { status, page, limit }],
    queryFn: () =>
      fetchData({ url: '/leave/my', page, limit, token, ...(status ? { status } : {}) }),
    enabled: !!token,
    placeholderData: keepPreviousData,
    retry: retryUnless4xx,
  });
  const rows = data?.data || [];

  const cancel = useMutation({
    mutationFn: (id) => patchData({ url: `/leave/my/${id}/cancel`, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Request cancelled');
      invalidateLeaveData(queryClient);
      setCancelRow(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel'),
  });

  const columns = [
    {
      header: 'Type',
      accessor: 'leaveType',
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{leaveTypeLabel(v)}</span>
      ),
    },
    {
      header: 'Dates',
      accessor: 'dates',
      render: (_, r) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatLeaveRange(r.fromDate, r.toDate)}
        </span>
      ),
    },
    {
      header: 'Days',
      accessor: 'days',
      render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300">{v ?? '—'}</span>,
    },
    {
      header: 'Paid',
      accessor: 'pay',
      render: (_, r) => <PaySplit request={{ ...r, applicantType: 'staff' }} />,
    },
    { header: 'Status', accessor: 'status', render: (v) => <StatusBadge status={v} /> },
    {
      header: 'Note',
      accessor: 'decisionNote',
      render: (v) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[16rem] inline-block">
          {v || '—'}
        </span>
      ),
    },
  ];

  const rowActions = (r) => {
    const list = [{ label: 'View Details', value: 'view', icon: Eye }];
    if (canCancelOwn(r))
      list.push({ label: 'Cancel request', value: 'cancel', icon: Ban, danger: true });
    return list;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">My requests</h2>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={`${inputCls} w-auto capitalize`}
        >
          <option value="">All statuses</option>
          {LEAVE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <QueryErrorState error={error} fallback="Could not load your requests" />
      ) : isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={['leaveType', 'dates', 'days', 'pay', 'status', 'decisionNote']}
          rowActions={rowActions}
          onRowAction={(v, r) => (v === 'cancel' ? setCancelRow(r) : setViewRow(r))}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={data?.total ?? rows.length}
        />
      )}
      <ConfirmModal
        isOpen={!!cancelRow}
        onClose={() => setCancelRow(null)}
        title="Cancel leave request"
        message={
          cancelRow
            ? `Cancel your ${leaveTypeLabel(cancelRow.leaveType).toLowerCase()} leave for ${formatLeaveRange(
                cancelRow.fromDate,
                cancelRow.toDate,
              )}?`
            : ''
        }
        confirmLabel="Cancel request"
        cancelLabel="Keep"
        confirmTone="danger"
        loading={cancel.isPending}
        onConfirm={() => cancelRow && cancel.mutate(cancelRow._id)}
      />
      <Modal
        isOpen={!!viewRow}
        onClose={() => setViewRow(null)}
        title="Leave request"
        size="sm"
        closeOnBackdrop
      >
        {viewRow && (
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <StatusBadge status={viewRow.status} />
            </div>
            <div>
              <strong>{leaveTypeLabel(viewRow.leaveType)}</strong> ·{' '}
              {formatLeaveRange(viewRow.fromDate, viewRow.toDate)} · {viewRow.days ?? '—'} day(s)
            </div>
            <div>
              <PaySplit request={{ ...viewRow, applicantType: 'staff' }} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-gray-500">Reason</span>
              <p>{viewRow.reason || '—'}</p>
            </div>
            {viewRow.decisionNote && (
              <div>
                <span className="text-xs font-semibold uppercase text-gray-500">Note</span>
                <p>{viewRow.decisionNote}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function MyLeavePage() {
  const { user } = useUserStore();
  const { accessToken: token } = useTokenStore();
  const t = useTranslations('myLeave');
  const canApply = hasAnyAction(user?.role, ['apply-own-leave']);
  const thisYear = currentAcademicYear();
  const [year, setYear] = useState(thisYear);

  const balanceQ = useQuery({
    queryKey: ['leave-my', 'balance', year],
    queryFn: () => fetchData({ url: '/leave/my/balance', token, leaveYear: year }),
    enabled: !!token && canApply,
    retry: retryUnless4xx,
  });

  const shell = (children) => (
    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        <div className="mb-6 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
        {children}
      </div>
    </div>
  );

  if (!canApply) {
    return shell(
      <div className={`${cardCls} text-center py-12 text-gray-600 dark:text-gray-400`}>
        You do not have permission to apply for leave.
      </div>,
    );
  }

  // No staff record behind the account (e.g. a school admin): the API answers
  // 403 "No staff profile linked to this account" (404 on some routes).
  const noStaffRecord =
    errorStatus(balanceQ.error) === 404 ||
    (errorStatus(balanceQ.error) === 403 &&
      /no staff profile/i.test(balanceQ.error?.message || ''));
  if (noStaffRecord) {
    return shell(
      <div className={`${cardCls} text-center py-12 text-gray-600 dark:text-gray-400`}>
        Your account is not linked to a staff record, so there is no own leave to show.
      </div>,
    );
  }

  return shell(
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">My balance</h2>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            {[thisYear, previousAcademicYear(thisYear)].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        {balanceQ.error ? (
          <QueryErrorState error={balanceQ.error} fallback="Could not load your balance" />
        ) : balanceQ.isLoading ? (
          <div className={`${cardCls} p-8 flex justify-center`}>
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BalanceTable balance={balanceQ.data?.data} />
        )}
      </div>
      <ApplyForm />
      <MyRequests />
    </div>,
  );
}
