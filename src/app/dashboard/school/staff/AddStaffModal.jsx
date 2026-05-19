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
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  roleId: yup.string().required('Role is required'),
  branchId: yup.string().required('Branch is required'),
  gender: yup
    .string()
    .oneOf(['male', 'female', 'other'], 'Select a gender')
    .required('Gender is required'),
  staffType: yup
    .string()
    .oneOf(['teaching', 'non-teaching'], 'Select staff type')
    .required('Staff type is required'),
  employmentType: yup
    .string()
    .oneOf(['permanent', 'contract', 'part-time', 'visiting'], 'Select employment type')
    .required('Employment type is required'),
  designation: yup.string().required('Designation is required'),
  phone: yup.string().optional(),
  dob: yup.string().optional(),
  cnic: yup.string().optional(),
  bloodGroup: yup.string().optional(),
  maritalStatus: yup.string().optional(),
  qualification: yup.string().optional(),
  experienceYears: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .optional(),
  joiningDate: yup.string().optional(),
  salary: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .optional(),
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

export default function AddStaffModal({ isOpen, onClose, onSuccess }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch = isAdmin || !!user?.role?.actions?.includes('create-all-branch-staff');
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
      roleId: '',
      branchId: '',
      gender: '',
      staffType: '',
      employmentType: '',
      designation: '',
      phone: '',
      dob: '',
      cnic: '',
      bloodGroup: '',
      maritalStatus: '',
      qualification: '',
      experienceYears: '',
      joiningDate: '',
      salary: '',
    },
  });

  const selectedBranchId = watch('branchId');

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

  // Reset roleId when branch changes
  useEffect(() => {
    setValue('roleId', '');
  }, [selectedBranchId, setValue]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canCreateAllBranch && isOpen,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: roleData } = useQuery({
    queryKey: ['roles-dropdown', selectedBranchId],
    queryFn: () =>
      fetchData({ url: '/role/list', page: 1, limit: 100, token, branchId: selectedBranchId }),
    enabled: !!token && !!selectedBranchId && isOpen,
    staleTime: 30000,
  });
  const roles = roleData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/staff/create', payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(res?.message || 'Staff created successfully');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        reset();
        onClose();
      }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to create staff';
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
      'roleId',
      'branchId',
      'gender',
      'staffType',
      'employmentType',
      'designation',
      'phone',
      'dob',
      'cnic',
      'bloodGroup',
      'maritalStatus',
      'qualification',
      'experienceYears',
      'joiningDate',
      'salary',
    ];
    scalarFields.forEach((k) => {
      const v = data[k];
      if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v));
    });

    const street = data['address.street'];
    const city = data['address.city'];
    const state = data['address.state'];
    if (street || city || state) {
      fd.append('address', JSON.stringify({ street, city, state }));
    }

    const ecName = data['emergencyContact.name'];
    const ecPhone = data['emergencyContact.phone'];
    const ecRelation = data['emergencyContact.relation'];
    if (ecName || ecPhone || ecRelation) {
      fd.append(
        'emergencyContact',
        JSON.stringify({
          name: ecName,
          phone: ecPhone,
          relation: ecRelation,
        }),
      );
    }

    if (photoFile) fd.append('photo', photoFile);

    mutation.mutate(fd);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Staff Member"
      subtitle="Fill in the required details to create a new staff account"
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
            label="Create Staff"
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

        {/* Account Info */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Account
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.name?.message}>
              <input {...register('name')} placeholder="Ahmed Ali" className={inputCls} />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <input
                {...register('email')}
                type="email"
                placeholder="ahmed@school.com"
                className={inputCls}
              />
            </Field>
            <Field label="Password" required error={errors.password?.message}>
              <input
                {...register('password')}
                type="password"
                placeholder="Min 6 characters"
                className={inputCls}
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="03211234567" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Branch & Role */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Branch & Role
          </h3>
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Role" required error={errors.roleId?.message}>
              <select
                {...register('roleId')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
                disabled={!selectedBranchId}
              >
                <option value="">
                  {selectedBranchId ? 'Select role...' : 'Select branch first'}
                </option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Employment Info */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Employment
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Designation" required error={errors.designation?.message}>
              <input
                {...register('designation')}
                placeholder="Class Teacher"
                className={inputCls}
              />
            </Field>
            <Field label="Staff Type" required error={errors.staffType?.message}>
              <select
                {...register('staffType')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
              >
                <option value="">Select type...</option>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>
            </Field>
            <Field label="Employment Type" required error={errors.employmentType?.message}>
              <select
                {...register('employmentType')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
              >
                <option value="">Select type...</option>
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="part-time">Part-Time</option>
                <option value="visiting">Visiting</option>
              </select>
            </Field>
            <Field label="Joining Date" error={errors.joiningDate?.message}>
              <input {...register('joiningDate')} type="date" className={inputCls} />
            </Field>
            <Field label="Qualification" error={errors.qualification?.message}>
              <input {...register('qualification')} placeholder="M.Ed" className={inputCls} />
            </Field>
            <Field label="Experience (Years)" error={errors.experienceYears?.message}>
              <input
                {...register('experienceYears')}
                type="number"
                min="0"
                placeholder="5"
                className={inputCls}
              />
            </Field>
            <Field label="Salary" error={errors.salary?.message}>
              <input
                {...register('salary')}
                type="number"
                min="0"
                placeholder="35000"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Personal Info */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Personal
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gender" required error={errors.gender?.message}>
              <select {...register('gender')} className={`${inputCls} bg-white dark:bg-gray-900`}>
                <option value="">Select gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Date of Birth" error={errors.dob?.message}>
              <input {...register('dob')} type="date" className={inputCls} />
            </Field>
            <Field label="CNIC" error={errors.cnic?.message}>
              <input {...register('cnic')} placeholder="35201-1234567-1" className={inputCls} />
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
            <Field label="Marital Status" error={errors.maritalStatus?.message}>
              <select
                {...register('maritalStatus')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
              >
                <option value="">Select...</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Address
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Street" error={errors['address.street']?.message}>
                <input
                  {...register('address.street')}
                  placeholder="House 12 Block A"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="City" error={errors['address.city']?.message}>
              <input {...register('address.city')} placeholder="Lahore" className={inputCls} />
            </Field>
            <Field label="State / Province" error={errors['address.state']?.message}>
              <input {...register('address.state')} placeholder="Punjab" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Emergency Contact
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" error={errors['emergencyContact.name']?.message}>
              <input
                {...register('emergencyContact.name')}
                placeholder="Ali Hassan"
                className={inputCls}
              />
            </Field>
            <Field label="Phone" error={errors['emergencyContact.phone']?.message}>
              <input
                {...register('emergencyContact.phone')}
                placeholder="03001234567"
                className={inputCls}
              />
            </Field>
            <Field label="Relation" error={errors['emergencyContact.relation']?.message}>
              <input
                {...register('emergencyContact.relation')}
                placeholder="Brother"
                className={inputCls}
              />
            </Field>
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
    </Modal>
  );
}
