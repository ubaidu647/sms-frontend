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
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

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

const baseSchema = {
  branchId: yup.string().required('Branch is required'),
  academicYear: yup
    .string()
    .matches(ACADEMIC_YEAR_REGEX, 'Format YYYY-YYYY')
    .required('Academic year is required'),
  classId: yup.string().required('Class is required'),
  subjectId: yup.string().required('Subject is required'),
  staffId: yup.string().required('Teacher is required'),
  role: yup.string().oneOf(['teacher', 'co-teacher', 'substitute']).optional(),
  isPrimary: yup.string().optional(),
  startDate: yup.string().optional(),
  endDate: yup.string().optional(),
  notes: yup.string().optional(),
};

const singleSchema = yup.object().shape({
  ...baseSchema,
  sectionId: yup.string().required('Section is required'),
});

const bulkSchema = yup.object().shape(baseSchema);

export default function AddAssignmentModal({ isOpen, mode = 'single', onClose, onSuccess }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch = isAdmin || !!user?.role?.actions?.includes('create-all-branch-teaching-assignment');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const isBulk = mode === 'bulk';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(isBulk ? bulkSchema : singleSchema),
    defaultValues: {
      branchId: '',
      academicYear: currentAcademicYear(),
      classId: '',
      sectionId: '',
      subjectId: '',
      staffId: '',
      role: 'teacher',
      isPrimary: 'true',
      startDate: '',
      endDate: '',
      notes: '',
    },
  });

  const branchId = watch('branchId');
  const academicYear = watch('academicYear');
  const classId = watch('classId');

  // For non-org users, lock branchId
  useEffect(() => {
    if (isOpen && !canCreateAllBranch && userBranchId) {
      setValue('branchId', userBranchId, { shouldValidate: true });
    }
  }, [isOpen, canCreateAllBranch, userBranchId, setValue]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
      setBulkResult(null);
      setSelectedSectionIds([]);
    }
  }, [isOpen, reset]);

  // Reset cascade
  useEffect(() => {
    setValue('classId', '');
    setValue('sectionId', '');
    setValue('subjectId', '');
    setValue('staffId', '');
    setSelectedSectionIds([]);
  }, [branchId, academicYear, setValue]);

  useEffect(() => {
    setValue('sectionId', '');
    setValue('subjectId', '');
    setSelectedSectionIds([]);
  }, [classId, setValue]);

  // Branches for org-level
  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canCreateAllBranch && isOpen,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Classes
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

  // Sections (for class)
  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId && isOpen,
    staleTime: 30000,
  });
  const sections = sectionData?.data || [];

  // Subjects (for class + year)
  const { data: subjectData } = useQuery({
    queryKey: ['subjects-dropdown', classId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/subject/list',
        page: 1,
        limit: 200,
        token,
        classId,
        academicYear,
      }),
    enabled: !!token && !!classId && !!academicYear && isOpen,
    staleTime: 30000,
  });
  const subjects = subjectData?.data || [];

  // Teaching staff (filtered to teaching only)
  const { data: staffData } = useQuery({
    queryKey: ['staff-teaching-dropdown', branchId],
    queryFn: () =>
      fetchData({
        url: '/staff/list',
        page: 1,
        limit: 200,
        token,
        staffType: 'teaching',
        branchId,
        isActive: 'true',
      }),
    enabled: !!token && !!branchId && isOpen,
    staleTime: 30000,
  });
  const teachers = staffData?.data || [];

  const singleMutation = useMutation({
    mutationFn: (payload) => postData({ url: '/teaching-assignment/create', payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success(res?.message || 'Teacher assigned successfully');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        reset();
        onClose();
      }, 800);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to assign teacher';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (payload) => postData({ url: '/teaching-assignment/bulk-create', payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      const { createdCount = 0, skippedCount = 0 } = res?.data || {};
      toast.success(`Assigned ${createdCount} sections${skippedCount ? `, ${skippedCount} skipped` : ''}`);
      setBulkResult(res?.data);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to assign teachers';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');

    const baseBody = {
      staffId: data.staffId,
      subjectId: data.subjectId,
      role: data.role || 'teacher',
      isPrimary: data.isPrimary === 'true',
    };
    if (data.startDate) baseBody.startDate = data.startDate;
    if (data.endDate) baseBody.endDate = data.endDate;
    if (data.notes) baseBody.notes = data.notes;

    if (isBulk) {
      if (!selectedSectionIds.length) {
        setSubmitError('Please select at least one section');
        return;
      }
      bulkMutation.mutate({ ...baseBody, sectionIds: selectedSectionIds });
    } else {
      singleMutation.mutate({ ...baseBody, sectionId: data.sectionId });
    }
  };

  const toggleSectionSelection = (sectionId) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    );
  };

  const handleClose = () => {
    if (bulkResult) onSuccess?.(bulkResult);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isBulk ? 'Bulk Assign Teacher' : 'Assign Teacher'}
      subtitle={
        isBulk
          ? 'Assign one teacher to the same subject across multiple sections'
          : 'Map a teacher to a subject for a specific section'
      }
      size="lg"
      footer={
        bulkResult ? (
          <div className="flex justify-end w-full">
            <Button
              label="Done"
              styleObject={{
                baseColor: 'bg-teal-600',
                hoverColor: 'hover:bg-teal-700',
                rounded: 'rounded-full',
                size: 'px-10 py-3 text-md min-h-[3rem]',
                textColor: 'text-white',
              }}
              handleClick={handleClose}
            />
          </div>
        ) : (
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
              label={isBulk ? `Assign to ${selectedSectionIds.length} sections` : 'Assign Teacher'}
              styleObject={{
                baseColor: 'bg-teal-600',
                hoverColor: 'hover:bg-teal-700',
                rounded: 'rounded-full',
                size: 'px-10 py-3 text-md min-h-[3rem]',
                textColor: 'text-white',
              }}
              loading={singleMutation.isPending || bulkMutation.isPending}
              success={successState}
              handleClick={handleSubmit(onSubmit)}
            />
          </div>
        )
      }
    >
      {bulkResult ? (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200">
            <h3 className="text-lg font-bold text-green-900">Bulk Assignment Complete</h3>
            <p className="text-sm text-green-800 dark:text-green-300 mt-1">
              Created {bulkResult.createdCount} of {bulkResult.total} requested.
            </p>
          </div>

          {bulkResult.created?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Created</h4>
              <ul className="space-y-1">
                {bulkResult.created.map((c) => {
                  const sec = sections.find((s) => s._id === c.sectionId);
                  return (
                    <li key={c._id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Section {sec?.name || c.sectionId}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{c.serialNumber}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {bulkResult.skipped?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Skipped</h4>
              <ul className="space-y-1">
                {bulkResult.skipped.map((s, i) => {
                  const sec = sections.find((sec) => sec._id === s.sectionId);
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span>Section {sec?.name || s.sectionId}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">— {s.reason}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <form className="space-y-6">
          {submitError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {submitError}
            </div>
          )}

          {/* Scope */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Scope</h3>
            <div className="grid grid-cols-2 gap-4">
              {canCreateAllBranch ? (
                <Field label="Branch" required error={errors.branchId?.message}>
                  <select {...register('branchId')} className={`${inputCls} bg-white dark:bg-gray-900`}>
                    <option value="">Select branch...</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </Field>
              ) : (
                <input type="hidden" {...register('branchId')} />
              )}
              <Field label="Academic Year" required error={errors.academicYear?.message}>
                <input {...register('academicYear')} placeholder="2025-2026" className={inputCls} />
              </Field>
              <Field label="Class" required error={errors.classId?.message}>
                <select
                  {...register('classId')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                  disabled={!branchId}
                >
                  <option value="">{branchId ? 'Select class...' : 'Select branch first'}</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.grade ? `(Grade ${c.grade})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              {!isBulk && (
                <Field label="Section" required error={errors.sectionId?.message}>
                  <select
                    {...register('sectionId')}
                    className={`${inputCls} bg-white dark:bg-gray-900`}
                    disabled={!classId}
                  >
                    <option value="">{classId ? 'Select section...' : 'Select class first'}</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.currentStrength}/{s.capacity})
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </div>

          {/* Section picker for bulk */}
          {isBulk && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                Sections to Assign ({selectedSectionIds.length} selected)
              </h3>
              {!classId ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Select a class to load sections.</p>
              ) : sections.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No sections in this class.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-end gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setSelectedSectionIds(sections.map((s) => s._id))}
                      className="text-xs text-teal-700 dark:text-teal-400 font-medium hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-xs text-gray-300">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSectionIds([])}
                      className="text-xs text-gray-500 dark:text-gray-400 font-medium hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {sections.map((s) => {
                    const checked = selectedSectionIds.includes(s._id);
                    return (
                      <label
                        key={s._id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          checked ? 'bg-teal-50 border border-teal-200' : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSectionSelection(s._id)}
                          className="w-4 h-4 accent-teal-600"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Section {s.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                          {s.currentStrength}/{s.capacity}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Subject + Teacher */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Subject &amp; Teacher
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Subject" required error={errors.subjectId?.message}>
                <select
                  {...register('subjectId')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                  disabled={!classId}
                >
                  <option value="">{classId ? 'Select subject...' : 'Select class first'}</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Teacher" required error={errors.staffId?.message}>
                <select
                  {...register('staffId')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                  disabled={!branchId}
                >
                  <option value="">{branchId ? 'Select teacher...' : 'Select branch first'}</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user?.name} {t.designation ? `— ${t.designation}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Role */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Role</h3>
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
                  <option value="true">Yes — primary (will demote any existing primary)</option>
                  <option value="false">No</option>
                </select>
              </Field>
              <Field label="Start Date" error={errors.startDate?.message}>
                <input {...register('startDate')} type="date" className={inputCls} />
              </Field>
              <Field label="End Date (optional, for substitutes)" error={errors.endDate?.message}>
                <input {...register('endDate')} type="date" className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Notes" error={errors.notes?.message}>
                  <input
                    {...register('notes')}
                    placeholder="Internal note about this assignment"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
