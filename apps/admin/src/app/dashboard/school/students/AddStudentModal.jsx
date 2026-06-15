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

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

const schema = yup.object().shape({
  // Account
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .min(6, 'Password must be at least 6 characters')
    .optional(),

  // Branch (only used by org-level admins)
  branchId: yup.string().required('Branch is required'),

  // Enrollment
  classId: yup.string().required('Class is required'),
  sectionId: yup.string().required('Section is required'),
  academicYear: yup
    .string()
    .matches(ACADEMIC_YEAR_REGEX, 'Academic year must be in format YYYY-YYYY')
    .required('Academic year is required'),
  admissionDate: yup.string().required('Admission date is required'),
  admissionType: yup.string().oneOf(['new', 'transfer'], 'Select admission type').optional(),

  // Personal
  dob: yup.string().required('Date of birth is required'),
  gender: yup
    .string()
    .oneOf(['male', 'female', 'other'], 'Select a gender')
    .required('Gender is required'),
  bloodGroup: yup.string().optional(),
  nationality: yup.string().optional(),
  religion: yup.string().optional(),
  bForm: yup.string().optional(),
  placeOfBirth: yup.string().optional(),
  phone: yup.string().optional(),

  // Father (required name)
  father: yup.object().shape({
    name: yup.string().required("Father's name is required"),
    cnic: yup.string().optional(),
    phone: yup.string().optional(),
    email: yup
      .string()
      .transform((v) => (v === '' ? undefined : v))
      .email('Invalid email')
      .optional(),
    occupation: yup.string().optional(),
    monthlyIncome: yup
      .number()
      .nullable()
      .transform((v, o) => (o === '' ? null : v))
      .optional(),
  }),

  // Mother (required name)
  mother: yup.object().shape({
    name: yup.string().required("Mother's name is required"),
    cnic: yup.string().optional(),
    phone: yup.string().optional(),
    occupation: yup.string().optional(),
  }),

  // Emergency contact (all required)
  emergencyContact: yup.object().shape({
    name: yup.string().required('Emergency contact name is required'),
    phone: yup.string().required('Emergency contact phone is required'),
    relation: yup.string().required('Emergency contact relation is required'),
  }),

  // Address (object required, all sub-fields optional)
  address: yup.object().shape({
    street: yup.string().optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    postalCode: yup.string().optional(),
    country: yup.string().optional(),
  }),

  // Fees
  feeDiscount: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .min(0, 'Min 0')
    .max(100, 'Max 100')
    .optional(),
  feeWaiver: yup.boolean().optional(),
  feeNotes: yup.string().optional(),

  // Previous school (transfer only)
  previousSchool: yup.object().shape({
    name: yup.string().optional(),
    lastClass: yup.string().optional(),
    reasonForLeaving: yup.string().optional(),
  }),
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

export default function AddStudentModal({ isOpen, onClose, onSuccess }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [createdStudent, setCreatedStudent] = useState(null);

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch =
    isAdmin || !!user?.role?.actions?.includes('create-all-branch-student');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      branchId: '',
      classId: '',
      sectionId: '',
      academicYear: currentAcademicYear(),
      admissionDate: new Date().toISOString().slice(0, 10),
      admissionType: 'new',
      dob: '',
      gender: '',
      bloodGroup: '',
      nationality: 'Pakistani',
      religion: '',
      bForm: '',
      placeOfBirth: '',
      phone: '',
      feeDiscount: '',
      feeWaiver: false,
      feeNotes: '',
    },
  });

  const selectedBranchId = watch('branchId');
  const selectedClassId = watch('classId');
  const academicYear = watch('academicYear');
  const admissionType = watch('admissionType');

  // For non-org users, lock branchId to their own branch
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
      setPhotoFile(null);
      setPhotoPreview('');
      setPhotoError('');
      setCreatedStudent(null);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return;
    }
    if (photoFile.type === 'application/pdf') {
      setPhotoPreview('');
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    if (!file) {
      setPhotoFile(null);
      return;
    }
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError(`File type not allowed (${file.type}). Allowed: jpg, png, webp, pdf`);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError('File too large (max 5 MB)');
      e.target.value = '';
      return;
    }
    setPhotoFile(file);
  };

  // Reset class & section when branch changes
  useEffect(() => {
    setValue('classId', '');
    setValue('sectionId', '');
  }, [selectedBranchId, setValue]);

  // Reset section when class changes
  useEffect(() => {
    setValue('sectionId', '');
  }, [selectedClassId, setValue]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canCreateAllBranch && isOpen,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', selectedBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: selectedBranchId,
        academicYear,
      }),
    enabled: !!token && !!selectedBranchId && !!academicYear && isOpen,
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
    mutationFn: (payload) => postData({ url: '/student/create', payload, token }),
    onError: (err) => {
      const msg = err.message || 'Failed to enroll student';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');

    const fd = new FormData();
    const scalarFields = [
      'name',
      'email',
      'password',
      'classId',
      'sectionId',
      'academicYear',
      'admissionDate',
      'admissionType',
      'dob',
      'gender',
      'bloodGroup',
      'nationality',
      'religion',
      'bForm',
      'placeOfBirth',
      'phone',
      'feeDiscount',
      'feeWaiver',
      'feeNotes',
    ];
    scalarFields.forEach((k) => {
      const v = data[k];
      if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v));
    });

    // Father — required name + optional rest
    fd.append(
      'father',
      JSON.stringify({
        name: data.father?.name,
        cnic: data.father?.cnic || undefined,
        phone: data.father?.phone || undefined,
        email: data.father?.email || undefined,
        occupation: data.father?.occupation || undefined,
        monthlyIncome: data.father?.monthlyIncome ?? undefined,
      }),
    );

    // Mother — required name + optional rest
    fd.append(
      'mother',
      JSON.stringify({
        name: data.mother?.name,
        cnic: data.mother?.cnic || undefined,
        phone: data.mother?.phone || undefined,
        occupation: data.mother?.occupation || undefined,
      }),
    );

    // Emergency Contact — all required
    fd.append(
      'emergencyContact',
      JSON.stringify({
        name: data.emergencyContact?.name,
        phone: data.emergencyContact?.phone,
        relation: data.emergencyContact?.relation,
      }),
    );

    // Address — object must be present, sub-fields optional
    fd.append(
      'address',
      JSON.stringify({
        street: data.address?.street || undefined,
        city: data.address?.city || undefined,
        state: data.address?.state || undefined,
        postalCode: data.address?.postalCode || undefined,
        country: data.address?.country || undefined,
      }),
    );

    // Previous school — transfer admission only
    if (data.admissionType === 'transfer') {
      const prev = {
        name: data.previousSchool?.name || undefined,
        lastClass: data.previousSchool?.lastClass || undefined,
        reasonForLeaving: data.previousSchool?.reasonForLeaving || undefined,
      };
      if (Object.values(prev).some(Boolean)) {
        fd.append('previousSchool', JSON.stringify(prev));
      }
    }

    if (photoFile) fd.append('photo', photoFile);

    // Capture dropdown labels at submit-time for the optimistic cache row —
    // the create response only returns IDs for class/section/branch, but the
    // students table renders nested `.name` fields. No /student/list refetch
    // happens after create (per user preference), so we must hand-shape the row.
    const selectedClass = classes.find((c) => c._id === data.classId);
    const selectedSection = sections.find((s) => s._id === data.sectionId);
    const selectedBranch =
      branches.find((b) => b._id === data.branchId) ||
      (data.branchId === userBranchId ? user?.branch : null);

    mutation.mutate(fd, {
      onSuccess: (res) => {
        const newStudent = res?.data;
        if (newStudent) {
          const enriched = {
            ...newStudent,
            user: { name: newStudent.name, email: newStudent.email },
            isActive: newStudent.isActive ?? true,
            academicStatus: newStudent.academicStatus ?? 'enrolled',
            class: selectedClass
              ? { _id: selectedClass._id, name: selectedClass.name, grade: selectedClass.grade }
              : null,
            section: selectedSection
              ? { _id: selectedSection._id, name: selectedSection.name }
              : null,
            branch: selectedBranch ? { _id: selectedBranch._id, name: selectedBranch.name } : null,
            father: data.father?.name ? { name: data.father.name } : null,
          };
          queryClient.setQueriesData({ queryKey: ['students'] }, (old) => {
            if (!old) return old;
            return {
              ...old,
              data: [enriched, ...(old.data || [])],
              total: (old.total || 0) + 1,
            };
          });
        }
        toast.success(res?.message || 'Student enrolled successfully');
        setCreatedStudent(newStudent || null);
        setSuccessState(true);
        // Don't auto-close — show admission number / default password to admin first.
      },
    });
  };

  const handleClose = () => {
    if (createdStudent) onSuccess?.(createdStudent);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enroll Student"
      subtitle="Fill in the required details to enroll a new student"
      size="xl"
      footer={
        createdStudent ? (
          <div className="flex gap-3 w-full justify-end">
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
              label="Enroll Student"
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
        )
      }
    >
      {createdStudent ? (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200">
            <h3 className="text-lg font-bold text-green-900">Student Enrolled</h3>
            <p className="text-sm text-green-800 dark:text-green-300 mt-1">
              {createdStudent.name} has been successfully enrolled.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                Admission Number
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {createdStudent.admissionNumber}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                Roll Number
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {createdStudent.rollNumber}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                Email
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                {createdStudent.email}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                Academic Year
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                {createdStudent.academicYear}
              </div>
            </div>
          </div>
          {createdStudent.defaultPasswordHint && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Default Password
              </div>
              <p className="text-sm text-amber-800 mt-1">
                The default login password is the admission number:{' '}
                <span className="font-mono font-bold bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-amber-300">
                  {createdStudent.admissionNumber}
                </span>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Please share this with the student/guardian and ask them to change it on first
                login.
              </p>
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

          {/* Account Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={errors.name?.message}>
                <input {...register('name')} placeholder="Ahmed Khan" className={inputCls} />
              </Field>
              <Field label="Email" required error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="ahmed@example.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Password" error={errors.password?.message}>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Min 6 chars (defaults to admission number)"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <input {...register('phone')} placeholder="+923001234567" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Enrollment */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Enrollment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {canCreateAllBranch ? (
                <Field label="Branch" required error={errors.branchId?.message}>
                  <select
                    {...register('branchId')}
                    className={`${inputCls} bg-white dark:bg-gray-900`}
                  >
                    <option value="">Select branch...</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
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
                  disabled={!selectedBranchId}
                >
                  <option value="">
                    {selectedBranchId ? 'Select class...' : 'Select branch first'}
                  </option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.grade ? `(Grade ${c.grade})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Section" required error={errors.sectionId?.message}>
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
              <Field label="Admission Date" required error={errors.admissionDate?.message}>
                <input {...register('admissionDate')} type="date" className={inputCls} />
              </Field>
              <Field label="Admission Type" error={errors.admissionType?.message}>
                <select
                  {...register('admissionType')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                >
                  <option value="new">New</option>
                  <option value="transfer">Transfer</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Personal */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Personal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date of Birth" required error={errors.dob?.message}>
                <input {...register('dob')} type="date" className={inputCls} />
              </Field>
              <Field label="Gender" required error={errors.gender?.message}>
                <select {...register('gender')} className={`${inputCls} bg-white dark:bg-gray-900`}>
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Blood Group" error={errors.bloodGroup?.message}>
                <select
                  {...register('bloodGroup')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                >
                  <option value="">Select...</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nationality" error={errors.nationality?.message}>
                <input {...register('nationality')} placeholder="Pakistani" className={inputCls} />
              </Field>
              <Field label="Religion" error={errors.religion?.message}>
                <input {...register('religion')} placeholder="Islam" className={inputCls} />
              </Field>
              <Field label="B-Form" error={errors.bForm?.message}>
                <input {...register('bForm')} placeholder="12345-1234567-1" className={inputCls} />
              </Field>
              <Field label="Place of Birth" error={errors.placeOfBirth?.message}>
                <input {...register('placeOfBirth')} placeholder="Karachi" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Father */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Father
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" required error={errors.father?.name?.message}>
                <input {...register('father.name')} placeholder="Mr. Khan" className={inputCls} />
              </Field>
              <Field label="CNIC" error={errors.father?.cnic?.message}>
                <input
                  {...register('father.cnic')}
                  placeholder="12345-1234567-1"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone" error={errors.father?.phone?.message}>
                <input
                  {...register('father.phone')}
                  placeholder="+923001234567"
                  className={inputCls}
                />
              </Field>
              <Field label="Email" error={errors.father?.email?.message}>
                <input
                  {...register('father.email')}
                  type="email"
                  placeholder="father@example.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Occupation" error={errors.father?.occupation?.message}>
                <input
                  {...register('father.occupation')}
                  placeholder="Engineer"
                  className={inputCls}
                />
              </Field>
              <Field label="Monthly Income" error={errors.father?.monthlyIncome?.message}>
                <input
                  {...register('father.monthlyIncome')}
                  type="number"
                  min="0"
                  placeholder="80000"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Mother */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Mother
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" required error={errors.mother?.name?.message}>
                <input {...register('mother.name')} placeholder="Mrs. Khan" className={inputCls} />
              </Field>
              <Field label="CNIC" error={errors.mother?.cnic?.message}>
                <input
                  {...register('mother.cnic')}
                  placeholder="12345-7654321-1"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone" error={errors.mother?.phone?.message}>
                <input
                  {...register('mother.phone')}
                  placeholder="+923001234567"
                  className={inputCls}
                />
              </Field>
              <Field label="Occupation" error={errors.mother?.occupation?.message}>
                <input
                  {...register('mother.occupation')}
                  placeholder="Teacher"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Name" required error={errors.emergencyContact?.name?.message}>
                <input
                  {...register('emergencyContact.name')}
                  placeholder="Uncle Ahmed"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone" required error={errors.emergencyContact?.phone?.message}>
                <input
                  {...register('emergencyContact.phone')}
                  placeholder="+923001234567"
                  className={inputCls}
                />
              </Field>
              <Field label="Relation" required error={errors.emergencyContact?.relation?.message}>
                <input
                  {...register('emergencyContact.relation')}
                  placeholder="Uncle"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Street">
                  <input
                    {...register('address.street')}
                    placeholder="House 5, Block A"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="City">
                <input {...register('address.city')} placeholder="Karachi" className={inputCls} />
              </Field>
              <Field label="State / Province">
                <input {...register('address.state')} placeholder="Sindh" className={inputCls} />
              </Field>
              <Field label="Postal Code">
                <input
                  {...register('address.postalCode')}
                  placeholder="75500"
                  className={inputCls}
                />
              </Field>
              <Field label="Country">
                <input
                  {...register('address.country')}
                  placeholder="Pakistan"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Previous School (transfer only) */}
          {admissionType === 'transfer' && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                Previous School
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="School Name">
                  <input
                    {...register('previousSchool.name')}
                    placeholder="ABC School"
                    className={inputCls}
                  />
                </Field>
                <Field label="Last Class">
                  <input
                    {...register('previousSchool.lastClass')}
                    placeholder="Grade 4"
                    className={inputCls}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Reason for Leaving">
                    <input
                      {...register('previousSchool.reasonForLeaving')}
                      placeholder="Family relocation"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Fees */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Fees (optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Discount (%)" error={errors.feeDiscount?.message}>
                <input
                  {...register('feeDiscount')}
                  type="number"
                  min="0"
                  max="100"
                  placeholder="10"
                  className={inputCls}
                />
              </Field>
              <Field label="Full Waiver">
                <select
                  {...register('feeWaiver')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                >
                  <option value={false}>No</option>
                  <option value={true}>Yes</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <input
                    {...register('feeNotes')}
                    placeholder="Sibling discount / scholarship reason"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Photo */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Photo (optional)
            </h3>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                  {photoFile?.type === 'application/pdf' ? 'PDF' : 'No image'}
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={handlePhotoChange}
                  className="block text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG, WEBP or PDF — max 5 MB
                </p>
                {photoFile && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {photoFile.name}{' '}
                    <span className="text-gray-400 dark:text-gray-500">
                      ({(photoFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </p>
                )}
                {photoError && <p className={errorCls}>{photoError}</p>}
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
