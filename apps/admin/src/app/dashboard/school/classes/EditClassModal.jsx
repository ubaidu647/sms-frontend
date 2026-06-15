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

const CLASS_TYPES = ['pre-primary', 'primary', 'middle', 'secondary', 'higher-secondary'];
const MEDIUMS = ['english', 'urdu', 'arabic', 'other'];

const schema = yup.object().shape({
  name: yup.string().optional(),
  classType: yup.string().optional(),
  medium: yup.string().optional(),
  classTeacher: yup.string().optional(),
  totalCapacity: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .optional(),
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

export default function EditClassModal({ isOpen, onClose, onSuccess, cls }) {
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
    if (cls && isOpen) {
      reset({
        name: cls.name || '',
        classType: cls.classType || '',
        medium: cls.medium || 'english',
        classTeacher: cls.classTeacherInfo?._id || '',
        totalCapacity: cls.totalCapacity ?? '',
        status: cls.status || 'active',
      });
    }
  }, [cls, isOpen, reset]);

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
    mutationFn: (payload) => putData({ url: `/class/${cls._id}`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', cls._id] });
      toast.success(res?.message || 'Class updated successfully');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to update class';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    const payload = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) payload[k] = v;
    });
    if ('classTeacher' in data && data.classTeacher === '') payload.classTeacher = null;
    mutation.mutate(payload);
  };

  if (!cls) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Class"
      subtitle={`Editing ${cls.name} — ${cls.grade} · ${cls.academicYear}`}
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
          Grade and academic year cannot be changed after creation.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Class Name" error={errors.name?.message}>
            <input {...register('name')} placeholder="Grade 5" className={inputCls} />
          </Field>
          <Field label="Class Type" error={errors.classType?.message}>
            <select {...register('classType')} className={inputCls}>
              <option value="">Select type...</option>
              {CLASS_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Medium" error={errors.medium?.message}>
            <select {...register('medium')} className={inputCls}>
              {MEDIUMS.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m}
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
          <Field label="Total Capacity" error={errors.totalCapacity?.message}>
            <input
              {...register('totalCapacity')}
              type="number"
              min="1"
              placeholder="120"
              className={inputCls}
            />
          </Field>
          <Field label="Class Teacher" error={errors.classTeacher?.message}>
            <select {...register('classTeacher')} className={inputCls}>
              <option value="">None</option>
              {teachingStaff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.user?.name} — {s.designation}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}
