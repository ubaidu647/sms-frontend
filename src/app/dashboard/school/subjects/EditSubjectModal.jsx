'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { SUBJECT_TYPES, SUBJECT_CATEGORIES, SUBJECT_CODE_REGEX } from '@/constants/subject';

const numFromInput = (v, o) => (o === '' || o === null || o === undefined ? null : v);

const schema = yup.object().shape({
  name: yup.string().optional(),
  code: yup
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .matches(SUBJECT_CODE_REGEX, {
      message: 'Code must be 2–10 chars, letters/numbers/dashes only',
      excludeEmptyString: true,
    })
    .optional(),
  subjectType: yup.string().oneOf(SUBJECT_TYPES, 'Select a type').optional(),
  category: yup.string().oneOf(SUBJECT_CATEGORIES, 'Select a category').optional(),
  totalMarks: yup.number().nullable().transform(numFromInput).min(1, 'Min 1').optional(),
  passingMarks: yup.number().nullable().transform(numFromInput).min(0, 'Min 0').optional(),
  theoryMarks: yup.number().nullable().transform(numFromInput).min(0, 'Min 0').optional(),
  practicalMarks: yup.number().nullable().transform(numFromInput).min(0, 'Min 0').optional(),
  creditHours: yup.number().nullable().transform(numFromInput).min(0, 'Min 0').optional(),
  defaultTeacher: yup.string().nullable().optional(),
  status: yup.string().optional(),
});

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';
const errorCls = 'text-red-500 text-xs mt-1';

function Field({ label, error, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

export default function EditSubjectModal({ isOpen, onClose, onSuccess, subject }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (subject && isOpen) {
      reset({
        name: subject.name || '',
        code: subject.code || '',
        subjectType: subject.subjectType || '',
        category: subject.category || '',
        totalMarks: subject.totalMarks ?? '',
        passingMarks: subject.passingMarks ?? '',
        theoryMarks: subject.theoryMarks ?? '',
        practicalMarks: subject.practicalMarks ?? '',
        creditHours: subject.creditHours ?? '',
        defaultTeacher: subject.teacherInfo?._id || subject.defaultTeacher || '',
        status: subject.status || 'active',
      });
    }
  }, [subject, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, reset]);

  const { data: staffData } = useQuery({
    queryKey: ['teaching-staff-dropdown'],
    queryFn: () =>
      fetchData({ url: '/staff/list', page: 1, limit: 200, token, staffType: 'teaching' }),
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const teachingStaff = staffData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: `/subject/${subject._id}`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subject-detail', subject._id] });
      toast.success(res?.message || 'Subject updated successfully');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to update subject';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const watchedTheory = watch('theoryMarks');
  const watchedPractical = watch('practicalMarks');
  const watchedTotal = watch('totalMarks');
  const sumMismatch =
    watchedTheory !== '' &&
    watchedTheory != null &&
    watchedPractical !== '' &&
    watchedPractical != null &&
    watchedTotal !== '' &&
    watchedTotal != null &&
    Number(watchedTheory) + Number(watchedPractical) !== Number(watchedTotal);

  const onSubmit = (data) => {
    setSubmitError('');
    if (data.theoryMarks != null && data.practicalMarks != null && data.totalMarks != null) {
      if (Number(data.theoryMarks) + Number(data.practicalMarks) !== Number(data.totalMarks)) {
        const msg = 'Theory + Practical must equal Total marks';
        setSubmitError(msg);
        toast.error(msg);
        return;
      }
    }

    const payload = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) payload[k] = v;
    });
    if ('defaultTeacher' in data && data.defaultTeacher === '') payload.defaultTeacher = null;
    if (payload.code) payload.code = String(payload.code).toUpperCase();
    mutation.mutate(payload);
  };

  if (!subject) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Subject"
      subtitle={`Editing ${subject.name} — ${subject.code} · ${subject.academicYear || ''}`}
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
            label="Save Changes"
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
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
          Class, branch and academic year cannot be changed after creation.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Subject Name" error={errors.name?.message}>
            <input {...register('name')} placeholder="Mathematics" className={inputCls} />
          </Field>
          <Field label="Code" error={errors.code?.message}>
            <input
              {...register('code')}
              placeholder="MATH"
              className={inputCls}
              style={{ textTransform: 'uppercase' }}
            />
          </Field>
          <Field label="Subject Type" error={errors.subjectType?.message}>
            <select {...register('subjectType')} className={inputCls}>
              <option value="">Select type...</option>
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <select {...register('category')} className={inputCls}>
              <option value="">Select category...</option>
              {SUBJECT_CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total Marks" error={errors.totalMarks?.message}>
            <input
              {...register('totalMarks')}
              type="number"
              min="1"
              placeholder="100"
              className={inputCls}
            />
          </Field>
          <Field label="Passing Marks" error={errors.passingMarks?.message}>
            <input
              {...register('passingMarks')}
              type="number"
              min="0"
              placeholder="40"
              className={inputCls}
            />
          </Field>
          <Field label="Theory Marks" error={errors.theoryMarks?.message}>
            <input
              {...register('theoryMarks')}
              type="number"
              min="0"
              placeholder="75"
              className={inputCls}
            />
          </Field>
          <Field label="Practical Marks" error={errors.practicalMarks?.message}>
            <input
              {...register('practicalMarks')}
              type="number"
              min="0"
              placeholder="25"
              className={inputCls}
            />
          </Field>
          <Field label="Credit Hours" error={errors.creditHours?.message}>
            <input
              {...register('creditHours')}
              type="number"
              min="0"
              placeholder="5"
              className={inputCls}
            />
          </Field>
          <Field label="Default Teacher" error={errors.defaultTeacher?.message}>
            <select {...register('defaultTeacher')} className={inputCls}>
              <option value="">None</option>
              {teachingStaff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.user?.name} — {s.designation}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <select {...register('status')} className={inputCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>

        {sumMismatch && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-xs">
            Theory + Practical must equal Total Marks.
          </div>
        )}
      </form>
    </Modal>
  );
}
