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

const schema = yup.object().shape({
  role: yup.string().oneOf(['teacher', 'co-teacher', 'substitute']).optional(),
  isPrimary: yup.string().optional(),
  startDate: yup.string().optional(),
  endDate: yup.string().optional(),
  notes: yup.string().optional(),
  status: yup.string().oneOf(['active', 'inactive', '']).optional(),
  isActive: yup.string().optional(),
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

export default function EditAssignmentModal({ isOpen, onClose, onSuccess, assignment }) {
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
  });

  useEffect(() => {
    if (assignment && isOpen) {
      reset({
        role: assignment.role || 'teacher',
        isPrimary: assignment.isPrimary ? 'true' : 'false',
        startDate: assignment.startDate ? assignment.startDate.slice(0, 10) : '',
        endDate: assignment.endDate ? assignment.endDate.slice(0, 10) : '',
        notes: assignment.notes || '',
        status: assignment.status || 'active',
        isActive: assignment.isActive === false ? 'false' : 'true',
      });
    }
  }, [assignment, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: `/teaching-assignment/${assignment._id}`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-detail', assignment._id] });
      toast.success(res?.message || 'Assignment updated');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 800);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to update assignment';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    const payload = {};
    if (data.role) payload.role = data.role;
    if (data.isPrimary !== undefined && data.isPrimary !== '') payload.isPrimary = data.isPrimary === 'true';
    if (data.startDate) payload.startDate = data.startDate;
    if (data.endDate) payload.endDate = data.endDate;
    if (data.notes != null) payload.notes = data.notes;
    if (data.status) payload.status = data.status;
    if (data.isActive !== undefined && data.isActive !== '') payload.isActive = data.isActive === 'true';
    mutation.mutate(payload);
  };

  if (!assignment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Assignment"
      subtitle={
        assignment.staff?.user?.name
          ? `${assignment.staff.user.name} — ${assignment.subject?.name} · ${assignment.class?.name}/${assignment.section?.name}`
          : 'Update assignment'
      }
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
      <form className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
          Teacher, subject and section cannot be changed. To change them, unassign and re-create.
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Role" error={errors.role?.message}>
            <select {...register('role')} className={`${inputCls} bg-white dark:bg-gray-900`}>
              <option value="teacher">Teacher</option>
              <option value="co-teacher">Co-teacher</option>
              <option value="substitute">Substitute</option>
            </select>
          </Field>
          <Field label="Primary Teacher?" error={errors.isPrimary?.message}>
            <select {...register('isPrimary')} className={`${inputCls} bg-white dark:bg-gray-900`}>
              <option value="true">Yes (will demote existing primary)</option>
              <option value="false">No</option>
            </select>
          </Field>
          <Field label="Start Date" error={errors.startDate?.message}>
            <input {...register('startDate')} type="date" className={inputCls} />
          </Field>
          <Field label="End Date" error={errors.endDate?.message}>
            <input {...register('endDate')} type="date" className={inputCls} />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <select {...register('status')} className={`${inputCls} bg-white dark:bg-gray-900`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Active" error={errors.isActive?.message}>
            <select {...register('isActive')} className={`${inputCls} bg-white dark:bg-gray-900`}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Notes" error={errors.notes?.message}>
              <input {...register('notes')} className={inputCls} />
            </Field>
          </div>
        </div>
      </form>
    </Modal>
  );
}
