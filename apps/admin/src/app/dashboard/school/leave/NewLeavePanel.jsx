'use client';
// Enter a leave request on behalf of a staff member or a student (e.g. a
// parent without portal access phoned in). Optionally approve it at once.
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '@/component/Button';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { localYMD } from '@/utils/localDate';
import { academicYearStartMonth } from '@/utils/academicYear';
import {
  REASON_MAX,
  REASON_MIN,
  countWorkingDays,
  leaveTypesFor,
  validateLeaveDates,
} from '@/utils/leave';
import {
  cardCls,
  errorCls,
  inputCls,
  labelCls,
  invalidateLeaveData,
  leaveTypeLabel,
  warningsOf,
} from './leaveShared';
import { BranchSelect, StaffSelect, StudentPicker } from './LeavePickers';

const schema = yup.object({
  applicantType: yup.string().oneOf(['staff', 'student']).required(),
  staffId: yup.string().when('applicantType', {
    is: 'staff',
    then: (s) => s.required('Pick a staff member'),
  }),
  studentId: yup.string().when('applicantType', {
    is: 'student',
    then: (s) => s.required('Pick a student'),
  }),
  leaveType: yup.string().required('Pick a leave type'),
  fromDate: yup.string().required('Start date is required'),
  toDate: yup.string().required('End date is required'),
  reason: yup
    .string()
    .trim()
    .min(REASON_MIN, `At least ${REASON_MIN} characters`)
    .max(REASON_MAX, `At most ${REASON_MAX} characters`)
    .required('Reason is required'),
  approve: yup.boolean(),
});

const defaults = () => ({
  applicantType: 'staff',
  staffId: '',
  studentId: '',
  leaveType: '',
  fromDate: localYMD(),
  toDate: localYMD(),
  reason: '',
  approve: false,
});

export default function NewLeavePanel({ canApprove, orgTier, onCreated }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [studentLabel, setStudentLabel] = useState('');
  const [staffBranchId, setStaffBranchId] = useState('');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: defaults() });

  const applicantType = watch('applicantType');
  const fromDate = watch('fromDate');
  const toDate = watch('toDate');
  const staffId = watch('staffId');
  const studentId = watch('studentId');
  const leaveType = watch('leaveType');
  const types = leaveTypesFor(applicantType);

  // A type valid for staff (e.g. annual) may not be valid for a student.
  useEffect(() => {
    if (leaveType && !types.includes(leaveType)) setValue('leaveType', '');
  }, [applicantType, leaveType, types, setValue]);

  const dateError =
    fromDate && toDate ? validateLeaveDates(fromDate, toDate, academicYearStartMonth()) : '';
  const workingHint = !dateError ? countWorkingDays(fromDate, toDate) : 0;

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/leave', payload, token }),
    onSuccess: (res, payload) => {
      toast.success(
        res?.message || (payload.approve ? 'Leave recorded and approved' : 'Leave request created'),
      );
      warningsOf(res).forEach((w) => toast(w, { icon: '⚠️', duration: 8000 }));
      invalidateLeaveData(queryClient, { attendance: !!payload.approve });
      reset(defaults());
      setStudentLabel('');
      onCreated?.();
    },
    onError: (err) => {
      setSubmitError(err.message || 'Failed to create leave');
      toast.error(err.message || 'Failed to create leave');
    },
  });

  const onSubmit = (values) => {
    setSubmitError('');
    if (dateError) {
      setSubmitError(dateError);
      return;
    }
    const payload = {
      applicantType: values.applicantType,
      leaveType: values.leaveType,
      fromDate: values.fromDate,
      toDate: values.toDate,
      reason: values.reason.trim(),
    };
    if (values.applicantType === 'staff') payload.staffId = values.staffId;
    else payload.studentId = values.studentId;
    if (canApprove && values.approve) payload.approve = true;
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardCls} space-y-4 max-w-3xl`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Leave for</label>
          <select
            {...register('applicantType', {
              onChange: () => {
                setValue('staffId', '');
                setValue('studentId', '');
                setStudentLabel('');
              },
            })}
            className={inputCls}
          >
            <option value="staff">Staff member</option>
            <option value="student">Student</option>
          </select>
        </div>

        {applicantType === 'staff' ? (
          <div>
            <label className={labelCls}>Staff member</label>
            {orgTier && (
              <div className="mb-2">
                <BranchSelect
                  value={staffBranchId}
                  onChange={(v) => {
                    setStaffBranchId(v);
                    setValue('staffId', '');
                  }}
                  allLabel="All branches"
                />
              </div>
            )}
            <StaffSelect
              value={staffId}
              onChange={(v) => setValue('staffId', v, { shouldValidate: true })}
              branchId={orgTier ? staffBranchId : ''}
            />
            {errors.staffId && <p className={errorCls}>{errors.staffId.message}</p>}
          </div>
        ) : (
          <div>
            <label className={labelCls}>Student</label>
            <StudentPicker
              value={studentId}
              label={studentLabel}
              onSelect={({ studentId: id, label }) => {
                setValue('studentId', id, { shouldValidate: true });
                setStudentLabel(label);
              }}
              onClear={() => {
                setValue('studentId', '');
                setStudentLabel('');
              }}
            />
            {errors.studentId && <p className={errorCls}>{errors.studentId.message}</p>}
          </div>
        )}

        <div>
          <label className={labelCls}>Leave type</label>
          <select {...register('leaveType')} className={inputCls}>
            <option value="">Select type...</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {leaveTypeLabel(t)}
              </option>
            ))}
          </select>
          {errors.leaveType && <p className={errorCls}>{errors.leaveType.message}</p>}
        </div>
        <div />

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
        fromDate &&
        toDate && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            About {workingHint} working day(s) (Mon–Sat estimate — the branch&apos;s working days
            decide the final count).
          </p>
        )
      )}

      <div>
        <label className={labelCls}>Reason</label>
        <textarea {...register('reason')} rows={3} maxLength={REASON_MAX} className={inputCls} />
        {errors.reason && <p className={errorCls}>{errors.reason.message}</p>}
      </div>

      {canApprove && (
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" {...register('approve')} />
          Approve now (writes the attendance rows immediately)
        </label>
      )}

      {submitError && <p className={errorCls}>{submitError}</p>}

      <div className="flex justify-end">
        <Button
          type="submit"
          label="Save leave"
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
