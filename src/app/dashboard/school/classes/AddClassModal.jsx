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

const GRADES = ['nursery','kg-1','kg-2','1','2','3','4','5','6','7','8','9','10','11','12'];
const CLASS_TYPES = ['pre-primary','primary','middle','secondary','higher-secondary'];
const MEDIUMS = ['english','urdu','arabic','other'];

const schema = yup.object().shape({
  name:         yup.string().required('Class name is required'),
  grade:        yup.string().oneOf(GRADES, 'Select a grade').required('Grade is required'),
  classType:    yup.string().oneOf(CLASS_TYPES, 'Select a class type').required('Class type is required'),
  academicYear: yup.string().matches(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY').required('Academic year is required'),
  medium:       yup.string().optional(),
  classTeacher: yup.string().optional(),
  totalCapacity:yup.number().nullable().transform((v, o) => (o === '' ? null : v)).optional(),
  status:       yup.string().optional(),
  branchId:     yup.string().optional(),
});

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';
const errorCls = 'text-red-500 text-xs mt-1';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

export default function AddClassModal({ isOpen, onClose, onSuccess }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch = isAdmin || !!user?.role?.actions?.includes('create-all-branch-class');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '', grade: '', classType: '', academicYear: '', medium: 'english',
      classTeacher: '', totalCapacity: '', status: 'active', branchId: '',
    },
  });

  useEffect(() => {
    if (!isOpen) { reset(); setSubmitError(''); setSuccessState(false); }
  }, [isOpen, reset]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canCreateAllBranch && isOpen,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: staffData } = useQuery({
    queryKey: ['teaching-staff-dropdown'],
    queryFn: () => fetchData({ url: '/staff/list', page: 1, limit: 200, token, staffType: 'teaching' }),
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const teachingStaff = staffData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/class/create', payload, token }),
    onSuccess: (res) => {
      const newClass = res?.data;
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success(res?.message || 'Class created successfully');
      onSuccess?.(newClass);
      setSuccessState(true);
      setTimeout(() => { setSuccessState(false); reset(); onClose(); }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to create class';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    const payload = { ...data };
    if (!canCreateAllBranch) delete payload.branchId;
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k];
    });
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Class"
      subtitle="Create a new class for a branch and academic year"
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{ baseColor: 'bg-white border border-gray-300', hoverColor: 'hover:bg-gray-50', rounded: 'rounded-full', size: 'px-10 py-3 text-md min-h-[3rem]', textColor: 'text-gray-700' }}
          />
          <Button
            label="Create Class"
            styleObject={{ baseColor: 'bg-teal-600', hoverColor: 'hover:bg-teal-700', rounded: 'rounded-full', size: 'px-10 py-3 text-md min-h-[3rem]', textColor: 'text-white' }}
            loading={mutation.isPending}
            success={successState}
            handleClick={handleSubmit(onSubmit)}
          />
        </div>
      }
    >
      <form className="space-y-6">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">{submitError}</div>
        )}

        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Basic Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Class Name" required error={errors.name?.message}>
              <input {...register('name')} placeholder="Grade 5" className={inputCls} />
            </Field>
            <Field label="Academic Year" required error={errors.academicYear?.message}>
              <input {...register('academicYear')} placeholder="2025-2026" className={inputCls} />
            </Field>
            <Field label="Grade" required error={errors.grade?.message}>
              <select {...register('grade')} className={`${inputCls}`}>
                <option value="">Select grade...</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Class Type" required error={errors.classType?.message}>
              <select {...register('classType')} className={inputCls}>
                <option value="">Select type...</option>
                {CLASS_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </Field>
            <Field label="Medium" error={errors.medium?.message}>
              <select {...register('medium')} className={inputCls}>
                {MEDIUMS.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Total Capacity" error={errors.totalCapacity?.message}>
              <input {...register('totalCapacity')} type="number" min="1" placeholder="120" className={inputCls} />
            </Field>
            <Field label="Class Teacher (optional)" error={errors.classTeacher?.message}>
              <select {...register('classTeacher')} className={inputCls}>
                <option value="">None</option>
                {teachingStaff.map((s) => (
                  <option key={s._id} value={s._id}>{s.user?.name} — {s.designation}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {canCreateAllBranch && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Branch</h3>
            <Field label="Branch" required error={errors.branchId?.message}>
              <select {...register('branchId')} className={inputCls}>
                <option value="">Select branch...</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </Field>
          </div>
        )}
      </form>
    </Modal>
  );
}
