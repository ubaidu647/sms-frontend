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
import { SUBJECT_TYPES, SUBJECT_CATEGORIES, SUBJECT_CODE_REGEX } from '@/constants/subject';

const numFromInput = (v, o) => (o === '' || o === null || o === undefined ? null : v);

const schema = yup.object().shape({
  classId:        yup.string().required('Class is required'),
  name:           yup.string().required('Subject name is required'),
  code:           yup.string()
                     .required('Code is required')
                     .matches(SUBJECT_CODE_REGEX, 'Code must be 2–10 chars, letters/numbers/dashes only'),
  subjectType:    yup.string().oneOf(SUBJECT_TYPES, 'Select a type').required('Type is required'),
  category:       yup.string().oneOf(SUBJECT_CATEGORIES, 'Select a category').required('Category is required'),
  totalMarks:     yup.number().typeError('Total marks is required').min(1, 'Min 1').required('Total marks is required'),
  passingMarks:   yup.number().typeError('Passing marks is required').min(0, 'Min 0').required('Passing marks is required')
                     .test('lte-total', 'Passing marks cannot exceed total', function (v) {
                       const { totalMarks } = this.parent;
                       return v == null || totalMarks == null || v <= totalMarks;
                     }),
  theoryMarks:    yup.number().nullable().transform(numFromInput).min(0, 'Min 0').optional(),
  practicalMarks: yup.number().nullable().transform(numFromInput).min(0, 'Min 0').optional(),
  creditHours:    yup.number().nullable().transform(numFromInput).min(0, 'Min 0').optional(),
  defaultTeacher: yup.string().optional(),
  status:         yup.string().optional(),
}).test('theory-practical-sum', 'Theory + Practical must equal Total', function (val) {
  const { theoryMarks, practicalMarks, totalMarks } = val || {};
  if (theoryMarks != null && practicalMarks != null) {
    if (Number(theoryMarks) + Number(practicalMarks) !== Number(totalMarks)) {
      return this.createError({ path: 'practicalMarks', message: 'Theory + Practical must equal Total marks' });
    }
  }
  return true;
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

export default function AddSubjectModal({ isOpen, onClose, onSuccess }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch = isAdmin || !!user?.role?.actions?.includes('create-all-branch-subject');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      classId: '', name: '', code: '', subjectType: '', category: '',
      totalMarks: '', passingMarks: '', theoryMarks: '', practicalMarks: '',
      creditHours: '', defaultTeacher: '', status: 'active',
    },
  });

  useEffect(() => {
    if (!isOpen) { reset(); setSubmitError(''); setSuccessState(false); }
  }, [isOpen, reset]);

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown-add-subject', canCreateAllBranch, userBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (!canCreateAllBranch && userBranchId) params.branchId = userBranchId;
      return fetchData({ url: '/class/list', ...params });
    },
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const classes = classData?.data || [];

  const { data: staffData } = useQuery({
    queryKey: ['teaching-staff-dropdown'],
    queryFn: () => fetchData({ url: '/staff/list', page: 1, limit: 200, token, staffType: 'teaching' }),
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const teachingStaff = staffData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/subject/create', payload, token }),
    onSuccess: (res) => {
      const newSubject = res?.data;
      if (newSubject) {
        queryClient.setQueriesData({ queryKey: ['subjects'] }, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [newSubject, ...(old.data || [])],
            total: (old.total || 0) + 1,
          };
        });
      }
      toast.success(res?.message || 'Subject created successfully');
      onSuccess?.(newSubject);
      setSuccessState(true);
      setTimeout(() => { setSuccessState(false); reset(); onClose(); }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to create subject';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    const payload = { ...data };
    if (payload.code) payload.code = String(payload.code).toUpperCase();
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k];
    });
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Subject"
      subtitle="Create a new subject under a class"
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
            label="Create Subject"
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{submitError}</div>
        )}

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Info</h3>
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Subject Name" required error={errors.name?.message}>
              <input {...register('name')} placeholder="Mathematics" className={inputCls} />
            </Field>
            <Field label="Code" required error={errors.code?.message}>
              <input
                {...register('code')}
                placeholder="MATH"
                className={inputCls}
                style={{ textTransform: 'uppercase' }}
              />
            </Field>
            <Field label="Subject Type" required error={errors.subjectType?.message}>
              <select {...register('subjectType')} className={inputCls}>
                <option value="">Select type...</option>
                {SUBJECT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </Field>
            <Field label="Category" required error={errors.category?.message}>
              <select {...register('category')} className={inputCls}>
                <option value="">Select category...</option>
                {SUBJECT_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Marks &amp; Credits</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Total Marks" required error={errors.totalMarks?.message}>
              <input {...register('totalMarks')} type="number" min="1" placeholder="100" className={inputCls} />
            </Field>
            <Field label="Passing Marks" required error={errors.passingMarks?.message}>
              <input {...register('passingMarks')} type="number" min="0" placeholder="40" className={inputCls} />
            </Field>
            <Field label="Theory Marks" error={errors.theoryMarks?.message}>
              <input {...register('theoryMarks')} type="number" min="0" placeholder="75" className={inputCls} />
            </Field>
            <Field label="Practical Marks" error={errors.practicalMarks?.message}>
              <input {...register('practicalMarks')} type="number" min="0" placeholder="25" className={inputCls} />
            </Field>
            <Field label="Credit Hours" error={errors.creditHours?.message}>
              <input {...register('creditHours')} type="number" min="0" placeholder="5" className={inputCls} />
            </Field>
            <Field label="Default Teacher" error={errors.defaultTeacher?.message}>
              <select {...register('defaultTeacher')} className={inputCls}>
                <option value="">None</option>
                {teachingStaff.map((s) => (
                  <option key={s._id} value={s._id}>{s.user?.name} — {s.designation}</option>
                ))}
              </select>
            </Field>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            If both Theory and Practical are provided, they must add up to Total Marks.
          </p>
        </div>
      </form>
    </Modal>
  );
}
