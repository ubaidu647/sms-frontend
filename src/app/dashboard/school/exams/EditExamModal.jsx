'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { EXAM_TYPES, EXAM_STATUSES, toYMD } from '@/constants/exam';

const schema = yup.object().shape({
  name: yup.string().required('Exam name is required'),
  type: yup.string().oneOf(EXAM_TYPES).required('Type is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup
    .string()
    .required('End date is required')
    .test('end-after-start', 'End date cannot be before start date', function (v) {
      const { startDate } = this.parent;
      if (!v || !startDate) return true;
      return new Date(v) >= new Date(startDate);
    }),
  status: yup.string().oneOf(EXAM_STATUSES).optional(),
  passingPercentage: yup
    .number()
    .typeError('Must be a number')
    .min(0)
    .max(100)
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

export default function EditExamModal({ isOpen, onClose, onSuccess, exam }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (isOpen && exam) {
      reset({
        name: exam.name || '',
        type: exam.type || '',
        startDate: toYMD(exam.startDate),
        endDate: toYMD(exam.endDate),
        status: exam.status || 'planned',
        passingPercentage: exam.passingPercentage ?? 40,
        description: exam.description || '',
      });
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, exam, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: `/exam/${exam._id}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Exam updated');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-detail', exam._id] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onSuccess?.(res?.data);
        onClose();
      }, 800);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to update exam';
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

  if (!exam) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Exam"
      subtitle={exam.name}
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Exam Name" required error={errors.name?.message}>
            <input {...register('name')} className={inputCls} />
          </Field>
          <Field label="Type" required error={errors.type?.message}>
            <select {...register('type')} className={inputCls}>
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
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
          <Field label="Status" error={errors.status?.message}>
            <select {...register('status')} className={inputCls}>
              {EXAM_STATUSES.filter((s) => s !== 'published').map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Passing Percentage" error={errors.passingPercentage?.message}>
            <input
              {...register('passingPercentage')}
              type="number"
              min="0"
              max="100"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message}>
          <textarea {...register('description')} rows={3} className={inputCls} />
        </Field>
      </form>
    </Modal>
  );
}
