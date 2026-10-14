'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { resolveScope } from '@/utils/permissions';
import { currentAcademicYear } from '@/utils/academicYear';
import {
  CLASS_GRADES,
  GRADE_OPTIONS,
  GUARDIAN_RELATIONS,
  STAFF_SOURCES,
  buildEnquiryPayload,
  enquiryFormValues,
  sourceLabel,
} from '@/utils/admission';
import {
  BranchSelect,
  Field,
  StaffSelect,
  inputCls,
  invalidateAdmissionData,
  modalPrimary,
  modalSecondary,
  sectionHeadingCls,
  warningsOf,
} from './admissionShared';
import { yearOptions } from './OverviewPanel';

const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;
const optionalEmail = yup
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .email('Invalid email')
  .optional();

const schemaFor = (needsBranch) =>
  yup.object().shape({
    branchId: needsBranch ? yup.string().required('Branch is required') : yup.string(),
    source: yup.string().required('Source is required'),
    academicYear: yup
      .string()
      .matches(ACADEMIC_YEAR_REGEX, 'Academic year must be in format YYYY-YYYY')
      .required('Academic year is required'),
    desiredGrade: yup.string().oneOf(CLASS_GRADES, 'Select a grade').required('Select a grade'),
    child: yup.object().shape({
      name: yup.string().trim().max(100).required("Child's name is required"),
      gender: yup.string().oneOf(['', 'male', 'female', 'other']),
      dob: yup.string(),
      previousSchool: yup.string().max(150),
      previousClass: yup.string().max(50),
    }),
    guardian: yup.object().shape({
      name: yup.string().trim().max(100).required("Guardian's name is required"),
      relation: yup.string().oneOf(GUARDIAN_RELATIONS).required('Relation is required'),
      phone: yup
        .string()
        .trim()
        .required('Phone is required')
        .test('digits', 'Enter a valid phone number', (v) => {
          const d = String(v || '').replace(/\D/g, '');
          return d.length >= 7 && d.length <= 15;
        }),
      email: optionalEmail,
      cnic: yup.string().max(20),
      occupation: yup.string().max(100),
    }),
    address: yup.string().max(300),
    notes: yup.string().max(1000),
    nextFollowUpDate: yup.string(),
    assignedTo: yup.string(),
  });

export default function EnquiryFormModal({ enquiry, userBranchId, onClose, onSaved }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const isEdit = !!enquiry;
  // Creating across branches needs the org-tier manage grant; otherwise the
  // server files it under the user's own branch.
  const needsBranch = !isEdit && resolveScope(user?.role, 'manage-enquiry') === 'all';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schemaFor(needsBranch)),
    defaultValues: enquiryFormValues(enquiry, {
      academicYear: currentAcademicYear(),
      branchId: needsBranch ? '' : userBranchId,
    }),
  });

  const branchId = watch('branchId');
  const source = watch('source');
  const staffBranch = isEdit
    ? String(enquiry.branchId?._id || enquiry.branchId || '')
    : needsBranch
      ? branchId
      : userBranchId;

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? putData({ url: `/admission/enquiries/${enquiry._id}`, payload, token })
        : postData({ url: '/admission/enquiries', payload, token }),
    onSuccess: (res) => {
      invalidateAdmissionData(queryClient);
      const w = warningsOf(res);
      toast.success(res?.message || (isEdit ? 'Enquiry updated' : 'Enquiry created'));
      w.forEach((msg) => toast(msg, { icon: '⚠️' }));
      onSaved?.(res?.data, w);
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Could not save the enquiry'),
  });

  const onSubmit = (values) =>
    mutation.mutate(buildEnquiryPayload(values, { isEdit, includeBranch: needsBranch }));

  const years = Array.from(new Set([...yearOptions(), enquiry?.academicYear].filter(Boolean)));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Edit ${enquiry.enquiryNumber || 'enquiry'}` : 'New enquiry'}
      subtitle={isEdit ? undefined : 'Record a walk-in, phone or referral enquiry'}
      size="lg"
      footer={
        <div className="flex gap-3 w-full justify-end">
          <Button label="Cancel" handleClick={onClose} styleObject={modalSecondary} />
          <Button
            label={isEdit ? 'Save changes' : 'Create enquiry'}
            loading={mutation.isPending}
            handleClick={handleSubmit(onSubmit)}
            styleObject={modalPrimary}
          />
        </div>
      }
    >
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <h3 className={sectionHeadingCls}>Enquiry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {needsBranch && (
              <Field label="Branch" required error={errors.branchId?.message}>
                <BranchSelect
                  value={branchId}
                  onChange={(v) => {
                    setValue('branchId', v, { shouldValidate: true });
                    setValue('assignedTo', '');
                  }}
                  allLabel="Select branch..."
                />
              </Field>
            )}
            <Field label="Source" required error={errors.source?.message}>
              {isEdit && source === 'online' ? (
                <input value={sourceLabel('online')} disabled className={inputCls} />
              ) : (
                <select {...register('source')} className={inputCls}>
                  {STAFF_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {sourceLabel(s)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Academic year" required error={errors.academicYear?.message}>
              <select {...register('academicYear')} className={inputCls}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Desired grade" required error={errors.desiredGrade?.message}>
              <select {...register('desiredGrade')} className={inputCls}>
                <option value="">Select grade...</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div>
          <h3 className={sectionHeadingCls}>Child</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" required error={errors.child?.name?.message}>
              <input {...register('child.name')} placeholder="Ahmed Khan" className={inputCls} />
            </Field>
            <Field label="Gender" error={errors.child?.gender?.message}>
              <select {...register('child.gender')} className={inputCls}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Date of birth" error={errors.child?.dob?.message}>
              <input type="date" {...register('child.dob')} className={inputCls} />
            </Field>
            <Field label="Previous school" error={errors.child?.previousSchool?.message}>
              <input {...register('child.previousSchool')} className={inputCls} />
            </Field>
            <Field label="Previous class" error={errors.child?.previousClass?.message}>
              <input {...register('child.previousClass')} className={inputCls} />
            </Field>
          </div>
        </div>

        <div>
          <h3 className={sectionHeadingCls}>Guardian</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" required error={errors.guardian?.name?.message}>
              <input {...register('guardian.name')} placeholder="Mr. Khan" className={inputCls} />
            </Field>
            <Field label="Relation" required error={errors.guardian?.relation?.message}>
              <select {...register('guardian.relation')} className={`${inputCls} capitalize`}>
                {GUARDIAN_RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Phone" required error={errors.guardian?.phone?.message}>
              <input
                {...register('guardian.phone')}
                placeholder="+923001234567"
                className={inputCls}
              />
            </Field>
            <Field label="Email" error={errors.guardian?.email?.message}>
              <input type="email" {...register('guardian.email')} className={inputCls} />
            </Field>
            <Field label="CNIC" error={errors.guardian?.cnic?.message}>
              <input
                {...register('guardian.cnic')}
                placeholder="12345-1234567-1"
                className={inputCls}
              />
            </Field>
            <Field label="Occupation" error={errors.guardian?.occupation?.message}>
              <input {...register('guardian.occupation')} className={inputCls} />
            </Field>
          </div>
        </div>

        <div>
          <h3 className={sectionHeadingCls}>Follow-up</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
              <input {...register('address')} className={inputCls} />
            </Field>
            <Field label="Notes" error={errors.notes?.message} className="sm:col-span-2">
              <textarea {...register('notes')} rows={3} className={inputCls} />
            </Field>
            <Field label="Next follow-up date" error={errors.nextFollowUpDate?.message}>
              <input type="date" {...register('nextFollowUpDate')} className={inputCls} />
            </Field>
            <Field label="Assign to" error={errors.assignedTo?.message}>
              <StaffSelect
                value={watch('assignedTo')}
                onChange={(v) => setValue('assignedTo', v)}
                branchId={staffBranch}
              />
            </Field>
          </div>
        </div>
      </form>
    </Modal>
  );
}
