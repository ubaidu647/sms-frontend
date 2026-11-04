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
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import { PASSWORD_MIN, PASSWORD_MAX } from '@/utils/changePassword';
import { editPayload, reportEmptiedRequired } from '@/utils/editPayload';
import { photoFailureMessage, saveFieldsThenPhoto } from '@/utils/saveWithPhoto';
import { useEditRecord } from '@/hooks/useEditRecord';
import EditRecordStatus from '@/component/EditRecordStatus';

// Fields the backend allows on a self-update (staff.controller update, scope
// 'own'). Everything else (designation, staffType, employmentType, salary,
// joiningDate, leavingDate, leavingReason, isActive) is rejected with a 403 —
// so we hide those sections and strip them from the payload when isSelf is true.
const SELF_ALLOWED_SCALARS = [
  'name',
  'phone',
  'gender',
  'dob',
  'cnic',
  'bloodGroup',
  'qualification',
  'maritalStatus',
];

const ALL_SCALARS = [
  'name',
  'designation',
  'staffType',
  'employmentType',
  'gender',
  'maritalStatus',
  'bloodGroup',
  'cnic',
  'dob',
  'phone',
  'qualification',
  'experienceYears',
  'salary',
  'joiningDate',
  'leavingDate',
  'leavingReason',
  'isActive',
];

// Fields that can't be cleared, with the error an emptied one blocks the save with.
const REQUIRED_FIELDS = {
  name: 'Name is required',
  gender: 'Gender is required',
  isActive: 'Status is required',
  designation: 'Designation is required',
  staffType: 'Staff type is required',
  employmentType: 'Employment type is required',
  joiningDate: 'Joining date is required',
};
// The server merges these into the stored objects, so only changed sub-fields go.
const MERGED_OBJECTS = ['address', 'emergencyContact'];

// The form's values for a staff record — also the baseline an edit is diffed against.
const formValuesOf = (staff) => ({
  name: staff.user?.name || '',
  designation: staff.designation || '',
  staffType: staff.staffType || '',
  employmentType: staff.employmentType || '',
  gender: staff.gender || '',
  maritalStatus: staff.maritalStatus || '',
  bloodGroup: staff.bloodGroup || '',
  cnic: staff.cnic || '',
  dob: staff.dob ? staff.dob.slice(0, 10) : '',
  phone: staff.phone || '',
  qualification: staff.qualification || '',
  experienceYears: staff.experienceYears ?? '',
  salary: staff.salary ?? '',
  joiningDate: staff.joiningDate ? staff.joiningDate.slice(0, 10) : '',
  leavingDate: staff.leavingDate ? staff.leavingDate.slice(0, 10) : '',
  leavingReason: staff.leavingReason || '',
  isActive: staff.isActive === false ? 'false' : 'true',
  address: {
    street: staff.address?.street || '',
    city: staff.address?.city || '',
    state: staff.address?.state || '',
  },
  emergencyContact: {
    name: staff.emergencyContact?.name || '',
    phone: staff.emergencyContact?.phone || '',
    relation: staff.emergencyContact?.relation || '',
  },
});

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

const schema = yup.object().shape({
  name: yup.string().optional(),
  designation: yup.string().optional(),
  staffType: yup.string().optional(),
  employmentType: yup.string().optional(),
  gender: yup.string().optional(),
  maritalStatus: yup.string().optional(),
  bloodGroup: yup.string().optional(),
  cnic: yup.string().optional(),
  dob: yup.string().optional(),
  phone: yup.string().optional(),
  qualification: yup.string().optional(),
  experienceYears: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .optional(),
  salary: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .optional(),
  joiningDate: yup.string().optional(),
  leavingDate: yup.string().optional(),
  leavingReason: yup.string().optional(),
  isActive: yup.string().optional(),
  // Optional reset of a COLLEAGUE's password. Blank → omitted from the payload
  // (keeps current password). Same rule as the API (8–128); confirm must match.
  // Never shown for your own record — the API refuses it there: your own
  // password goes through Settings → Password (current password required).
  password: yup
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`)
    .optional(),
  confirmPassword: yup.string().when('password', {
    is: (val) => !!val,
    then: (s) =>
      s
        .required('Please confirm the new password')
        .oneOf([yup.ref('password')], 'Passwords do not match'),
    otherwise: (s) => s.optional(),
  }),
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

export default function EditStaffModal({ isOpen, onClose, onSuccess, staff, isSelf = false }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  // Editing your own account — whether via the self-only view or an admin
  // opening their own row: the password fields are hidden (the API refuses a
  // password there) and a link to Change password is shown instead.
  const staffUserId = String(staff?.user?._id || staff?.userId?._id || staff?.userId || '');
  const ownUserId = String(user?._id || user?.id || '');
  const isOwnAccount =
    isSelf ||
    (!!staff?._id && !!user?.staffId && String(staff._id) === String(user.staffId)) ||
    (!!staffUserId && staffUserId === ownUserId);
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  // The saved form values edits are diffed against: the full record (a list row
  // lacks many fields), then whatever a partly failed save committed.
  const [baseline, setBaseline] = useState(null);

  const recordQuery = useEditRecord({
    kind: 'staff-edit',
    id: staff?._id,
    url: `/staff/${staff?._id}`,
    isOpen,
    token,
  });
  const record = recordQuery.data?.data;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Pre-fill the form once the full record has loaded
  useEffect(() => {
    if (record && isOpen) {
      const values = formValuesOf(record);
      setBaseline(values);
      reset({ ...values, password: '', confirmPassword: '' });
      setPhotoFile(null);
      setPhotoPreview('');
      setPhotoError('');
    }
  }, [record, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setBaseline(null);
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

  const invalidateStaff = () => {
    queryClient.invalidateQueries({ queryKey: ['staff'] });
    queryClient.invalidateQueries({ queryKey: ['staff-detail', staff._id] });
  };

  const mutation = useMutation({
    mutationFn: ({ fields, photo }) =>
      saveFieldsThenPhoto({
        fields,
        photo,
        put: (payload) => putData({ url: `/staff/${staff._id}`, payload, token }),
      }),
    onSuccess: (res) => {
      invalidateStaff();
      toast.success(res?.message || 'Staff updated successfully');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 1000);
    },
    onError: (err, { values }) => {
      if (err.fieldsSaved) {
        // The fields are committed: they become the baseline, so saving again
        // retries only the photo (still selected).
        invalidateStaff();
        setBaseline(values);
        reset({ ...values, password: '', confirmPassword: '' });
        const msg = photoFailureMessage(err);
        setSubmitError(msg);
        toast.error(msg);
        return;
      }
      const msg = err.message || 'Failed to update staff';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    if (!baseline) return;
    setSubmitError('');

    const keys = [...(isSelf ? SELF_ALLOWED_SCALARS : ALL_SCALARS), ...MERGED_OBJECTS];
    const pick = (obj) => Object.fromEntries(keys.map((k) => [k, obj[k]]));
    if (reportEmptiedRequired(pick(baseline), pick(data), REQUIRED_FIELDS, setError)) return;

    const fields = editPayload(pick(baseline), pick(data), {
      required: Object.keys(REQUIRED_FIELDS),
      merge: MERGED_OBJECTS,
    });

    // Only send password when the user actually typed one — blank keeps the
    // current password. Never for your own account (the field is hidden).
    if (data.password && !isOwnAccount) fields.password = data.password;

    if (Object.keys(fields).length === 0 && !photoFile) {
      setSubmitError('Nothing to save — no field was changed.');
      return;
    }

    const { password: _password, confirmPassword: _confirmPassword, ...values } = data;
    mutation.mutate({ fields, photo: photoFile, values });
  };

  if (!staff) return null;

  const currentPhoto = record?.photo || '';

  // Closing mid-save would let this save's callbacks paint into the next record.
  const closeIfIdle = () => {
    if (!mutation.isPending) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeIfIdle}
      title={isSelf ? 'Edit My Profile' : 'Edit Staff Member'}
      subtitle={
        isSelf
          ? 'You can update personal info — HR fields like designation, salary, and dates are read-only.'
          : `Updating ${staff.user?.name || 'staff'} — only the fields you change are saved`
      }
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={closeIfIdle}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          {baseline && (
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
          )}
        </div>
      }
    >
      {!baseline && (
        <EditRecordStatus query={recordQuery} fallback="Could not load this staff member" />
      )}
      <form className="space-y-6" hidden={!baseline}>
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
          Email, role and branch cannot be changed after creation.
        </div>

        {/* Basic Info */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Basic Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.name?.message}>
              <input {...register('name')} placeholder="Ahmed Ali" className={inputCls} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="03211234567" className={inputCls} />
            </Field>
            <Field label="Gender" error={errors.gender?.message}>
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
            {!isSelf && (
              <Field label="Status" error={errors.isActive?.message}>
                <select
                  {...register('isActive')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
            )}
          </div>
        </div>

        {/* Security — reset a colleague's password; your own goes through Change password */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Security
          </h3>
          {isOwnAccount ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              To change your own password, use{' '}
              <Link
                href="/dashboard/settings/password"
                className="text-teal-600 font-semibold hover:underline"
              >
                Change password
              </Link>{' '}
              — it asks for your current password.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="New Password" error={errors.password?.message}>
                  <input
                    {...register('password')}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Leave blank to keep current"
                    className={inputCls}
                  />
                </Field>
                <Field label="Confirm New Password" error={errors.confirmPassword?.message}>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    className={inputCls}
                  />
                </Field>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to keep the current password. A new password must be at least{' '}
                {PASSWORD_MIN} characters and takes effect immediately (the staff member is signed
                out everywhere).
              </p>
            </>
          )}
        </div>

        {/* Employment — HR-only, hidden on self-update */}
        {!isSelf && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Employment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Designation" error={errors.designation?.message}>
                <input
                  {...register('designation')}
                  placeholder="Class Teacher"
                  className={inputCls}
                />
              </Field>
              <Field label="Staff Type" error={errors.staffType?.message}>
                <select
                  {...register('staffType')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                >
                  <option value="">Select type...</option>
                  <option value="teaching">Teaching</option>
                  <option value="non-teaching">Non-Teaching</option>
                </select>
              </Field>
              <Field label="Employment Type" error={errors.employmentType?.message}>
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
              <Field label="Joining Date" error={errors.joiningDate?.message}>
                <input {...register('joiningDate')} type="date" className={inputCls} />
              </Field>
            </div>
          </div>
        )}

        {/* Leaving (optional) — HR-only */}
        {!isSelf && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              Leaving (optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Leaving Date" error={errors.leavingDate?.message}>
                <input {...register('leavingDate')} type="date" className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Leaving Reason" error={errors.leavingReason?.message}>
                  <input
                    {...register('leavingReason')}
                    placeholder="Resigned / transferred..."
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

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
                  placeholder="House 12 Block A"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="City">
              <input {...register('address.city')} placeholder="Lahore" className={inputCls} />
            </Field>
            <Field label="State / Province">
              <input {...register('address.state')} placeholder="Punjab" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name">
              <input
                {...register('emergencyContact.name')}
                placeholder="Ali Hassan"
                className={inputCls}
              />
            </Field>
            <Field label="Phone">
              <input
                {...register('emergencyContact.phone')}
                placeholder="03001234567"
                className={inputCls}
              />
            </Field>
            <Field label="Relation">
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
            Photo
          </h3>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : currentPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPhoto}
                alt="Current"
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
                Leave empty to keep current photo. JPG, PNG, WEBP or PDF — max 5 MB.
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
