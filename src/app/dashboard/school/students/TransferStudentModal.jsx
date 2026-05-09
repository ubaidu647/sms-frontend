'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;

const schema = yup.object().shape({
  classId: yup.string().required('Class is required'),
  sectionId: yup.string().required('Section is required'),
  academicYear: yup
    .string()
    .matches(ACADEMIC_YEAR_REGEX, 'Academic year must be in format YYYY-YYYY')
    .required('Academic year is required'),
});

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';
const errorCls = 'text-red-500 text-xs mt-1';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

export default function TransferStudentModal({ isOpen, onClose, onSuccess, student }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { classId: '', sectionId: '', academicYear: '' },
  });

  const selectedClassId = watch('classId');
  const academicYear = watch('academicYear');

  useEffect(() => {
    if (isOpen && student) {
      reset({
        classId: '',
        sectionId: '',
        academicYear: student.academicYear || '',
      });
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, student, reset]);

  // Reset section when class changes
  useEffect(() => {
    setValue('sectionId', '');
  }, [selectedClassId, setValue]);

  const branchId = student?.branch?._id || '';

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', branchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId,
        academicYear,
      }),
    enabled: !!token && !!branchId && !!academicYear && isOpen,
    staleTime: 30000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', selectedClassId],
    queryFn: () => fetchData({ url: `/class/${selectedClassId}/sections`, token }),
    enabled: !!token && !!selectedClassId && isOpen,
    staleTime: 30000,
  });
  const sections = sectionData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) =>
      patchData({ url: `/student/${student._id}/transfer`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-detail', student._id] });
      toast.success(res?.message || 'Student transferred successfully');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to transfer student';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    mutation.mutate({
      classId: data.classId,
      sectionId: data.sectionId,
      academicYear: data.academicYear,
    });
  };

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Student"
      subtitle={`Move ${student.user?.name || 'student'} to a new class / section`}
      size="md"
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
            label="Transfer"
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
      <form className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-lg text-blue-800 dark:text-blue-300 text-xs">
          <div className="font-semibold mb-1">Current placement</div>
          <div>
            {student.class?.name}{student.section?.name ? ` / ${student.section.name}` : ''} ·{' '}
            {student.academicYear} · Roll {student.rollNumber}
          </div>
          <div className="mt-1 text-blue-700 dark:text-blue-400">
            Transferring will assign a new roll number and reset academic status to "enrolled".
          </div>
        </div>

        <Field label="Academic Year" required error={errors.academicYear?.message}>
          <input {...register('academicYear')} placeholder="2026-2027" className={inputCls} />
        </Field>

        <Field label="New Class" required error={errors.classId?.message}>
          <select
            {...register('classId')}
            className={`${inputCls} bg-white dark:bg-gray-900`}
            disabled={!academicYear}
          >
            <option value="">
              {academicYear ? 'Select class...' : 'Enter academic year first'}
            </option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.grade ? `(Grade ${c.grade})` : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="New Section" required error={errors.sectionId?.message}>
          <select
            {...register('sectionId')}
            className={`${inputCls} bg-white dark:bg-gray-900`}
            disabled={!selectedClassId}
          >
            <option value="">
              {selectedClassId ? 'Select section...' : 'Select class first'}
            </option>
            {sections.map((s) => {
              const isFull = s.currentStrength >= s.capacity;
              return (
                <option key={s._id} value={s._id} disabled={isFull}>
                  {s.name} ({s.currentStrength}/{s.capacity}){isFull ? ' — FULL' : ''}
                </option>
              );
            })}
          </select>
        </Field>
      </form>
    </Modal>
  );
}
