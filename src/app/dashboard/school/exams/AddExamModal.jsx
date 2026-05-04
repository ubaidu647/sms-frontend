'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { EXAM_TYPES, currentAcademicYear } from '@/constants/exam';

const schema = yup.object().shape({
  name: yup.string().required('Exam name is required'),
  type: yup.string().oneOf(EXAM_TYPES, 'Select a type').required('Type is required'),
  classId: yup.string().required('Class is required'),
  academicYear: yup
    .string()
    .matches(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY')
    .required('Academic year is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup
    .string()
    .required('End date is required')
    .test('end-after-start', 'End date cannot be before start date', function (v) {
      const { startDate } = this.parent;
      if (!v || !startDate) return true;
      return new Date(v) >= new Date(startDate);
    }),
  passingPercentage: yup
    .number()
    .typeError('Must be a number')
    .min(0, 'Min 0')
    .max(100, 'Max 100')
    .nullable()
    .transform((v, o) => (o === '' ? null : v)),
  description: yup.string().optional(),
});

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function AddExamModal({ isOpen, onClose, onSuccess }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch =
    isAdmin || !!user?.role?.actions?.includes('create-all-branch-exam');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      type: '',
      classId: '',
      academicYear: currentAcademicYear(),
      startDate: '',
      endDate: '',
      passingPercentage: 40,
      description: '',
    },
  });

  const academicYear = watch('academicYear');

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, reset]);

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown-add-exam', canCreateAllBranch, userBranchId, academicYear],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (academicYear) params.academicYear = academicYear;
      if (!canCreateAllBranch && userBranchId) params.branchId = userBranchId;
      return fetchData({ url: '/class/list', ...params });
    },
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const classes = classData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/exam/create', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Exam created');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        reset();
        onSuccess?.(res?.data);
        onClose();
      }, 800);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to create exam';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    const payload = { ...data };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k];
    });
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Exam"
      subtitle="Schedule a new exam for a class"
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label="Create Exam"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={mutation.isPending}
            success={successState}
            handleClick={handleSubmit(onSubmit)}
          />
        </div>
      }
    >
      <form className="space-y-6">
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Exam Info
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Exam Name" required error={errors.name?.message}>
              <input
                {...register('name')}
                placeholder="Mid-Term Exam — Sept 2025"
                className={inputCls}
              />
            </Field>
            <Field label="Type" required error={errors.type?.message}>
              <select {...register('type')} className={inputCls}>
                <option value="">Select type...</option>
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Academic Year" required error={errors.academicYear?.message}>
              <input {...register('academicYear')} placeholder="2025-2026" className={inputCls} />
            </Field>
            <Field label="Class" required error={errors.classId?.message}>
              <select {...register('classId')} className={inputCls}>
                <option value="">Select class...</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.grade ? `(Grade ${c.grade})` : ''} — {c.academicYear}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start Date" required error={errors.startDate?.message}>
              <input {...register('startDate')} type="date" className={inputCls} />
            </Field>
            <Field label="End Date" required error={errors.endDate?.message}>
              <input {...register('endDate')} type="date" className={inputCls} />
            </Field>
            <Field label="Passing Percentage" error={errors.passingPercentage?.message}>
              <input
                {...register('passingPercentage')}
                type="number"
                min="0"
                max="100"
                placeholder="40"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Description
          </h3>
          <Field label="Description" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Optional notes about this exam"
              className={inputCls}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
