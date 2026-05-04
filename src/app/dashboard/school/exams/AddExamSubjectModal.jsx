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

const numFromInput = (v, o) => (o === '' || o === null || o === undefined ? null : v);

const schema = yup.object().shape({
  subjectId: yup.string().required('Subject is required'),
  examDate: yup.string().required('Exam date is required'),
  startTime: yup.string().optional(),
  endTime: yup.string().optional(),
  totalMarks: yup
    .number()
    .typeError('Total marks is required')
    .min(1, 'Min 1')
    .required('Total marks is required'),
  passingMarks: yup
    .number()
    .typeError('Passing marks is required')
    .min(0, 'Min 0')
    .required('Passing marks is required')
    .test('lte-total', 'Passing marks cannot exceed total', function (v) {
      const { totalMarks } = this.parent;
      return v == null || totalMarks == null || v <= totalMarks;
    }),
  theoryMarks: yup
    .number()
    .nullable()
    .transform(numFromInput)
    .min(0, 'Min 0')
    .optional(),
  practicalMarks: yup
    .number()
    .nullable()
    .transform(numFromInput)
    .min(0, 'Min 0')
    .optional(),
}).test('theory-practical-sum', 'Theory + Practical must equal Total', function (val) {
  const { theoryMarks, practicalMarks, totalMarks } = val || {};
  if (theoryMarks != null && practicalMarks != null) {
    if (Number(theoryMarks) + Number(practicalMarks) !== Number(totalMarks)) {
      return this.createError({
        path: 'practicalMarks',
        message: 'Theory + Practical must equal Total marks',
      });
    }
  }
  return true;
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

export default function AddExamSubjectModal({ isOpen, onClose, onSuccess, examId, classId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      subjectId: '',
      examDate: '',
      startTime: '',
      endTime: '',
      totalMarks: 100,
      passingMarks: 40,
      theoryMarks: '',
      practicalMarks: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, reset]);

  const { data: subjectData } = useQuery({
    queryKey: ['subjects-for-class', classId],
    queryFn: () =>
      fetchData({ url: '/subject/list', page: 1, limit: 200, token, classId, isActive: true }),
    enabled: !!token && isOpen && !!classId,
    staleTime: 30000,
  });
  const subjects = subjectData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: `/exam/${examId}/subjects`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Subject added');
      queryClient.invalidateQueries({ queryKey: ['exam-detail', examId] });
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
      const msg = err.message || 'Failed to add subject';
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
      title="Add Subject to Exam"
      subtitle="Schedule a subject paper"
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
            label="Add Subject"
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject" required error={errors.subjectId?.message}>
            <select {...register('subjectId')} className={inputCls}>
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Exam Date" required error={errors.examDate?.message}>
            <input {...register('examDate')} type="date" className={inputCls} />
          </Field>
          <Field label="Start Time" error={errors.startTime?.message}>
            <input {...register('startTime')} type="time" className={inputCls} />
          </Field>
          <Field label="End Time" error={errors.endTime?.message}>
            <input {...register('endTime')} type="time" className={inputCls} />
          </Field>
          <Field label="Total Marks" required error={errors.totalMarks?.message}>
            <input
              {...register('totalMarks')}
              type="number"
              min="1"
              placeholder="100"
              className={inputCls}
            />
          </Field>
          <Field label="Passing Marks" required error={errors.passingMarks?.message}>
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
        </div>
        <p className="text-xs text-gray-500">
          If both Theory and Practical are provided, they must add up to Total Marks.
        </p>
      </form>
    </Modal>
  );
}
