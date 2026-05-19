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

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const ACADEMIC_STATUSES = [
  'enrolled',
  'promoted',
  'transferred',
  'graduated',
  'dropped',
  'suspended',
];

const schema = yup.object().shape({
  name: yup.string().optional(),
  dob: yup.string().optional(),
  gender: yup.string().optional(),
  bloodGroup: yup.string().optional(),
  nationality: yup.string().optional(),
  religion: yup.string().optional(),
  bForm: yup.string().optional(),
  placeOfBirth: yup.string().optional(),
  phone: yup.string().optional(),

  academicStatus: yup.string().optional(),
  isActive: yup.string().optional(),

  feeDiscount: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .min(0, 'Min 0')
    .max(100, 'Max 100')
    .optional(),
  feeWaiver: yup.string().optional(),
  feeNotes: yup.string().optional(),
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

export default function EditStudentModal({ isOpen, onClose, onSuccess, student }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Pre-fill form when student changes
  useEffect(() => {
    if (student && isOpen) {
      reset({
        name: student.user?.name || '',
        dob: student.dob ? student.dob.slice(0, 10) : '',
        gender: student.gender || '',
        bloodGroup: student.bloodGroup || '',
        nationality: student.nationality || '',
        religion: student.religion || '',
        bForm: student.bForm || '',
        placeOfBirth: student.placeOfBirth || '',
        phone: student.phone || '',
        academicStatus: student.academicStatus || '',
        isActive: student.isActive === false ? 'false' : 'true',
        feeDiscount: student.feeDiscount ?? '',
        feeWaiver: student.feeWaiver ? 'true' : 'false',
        feeNotes: student.feeNotes || '',

        'father.name': student.father?.name || '',
        'father.cnic': student.father?.cnic || '',
        'father.phone': student.father?.phone || '',
        'father.email': student.father?.email || '',
        'father.occupation': student.father?.occupation || '',
        'father.monthlyIncome': student.father?.monthlyIncome ?? '',

        'mother.name': student.mother?.name || '',
        'mother.cnic': student.mother?.cnic || '',
        'mother.phone': student.mother?.phone || '',
        'mother.occupation': student.mother?.occupation || '',

        'emergencyContact.name': student.emergencyContact?.name || '',
        'emergencyContact.phone': student.emergencyContact?.phone || '',
        'emergencyContact.relation': student.emergencyContact?.relation || '',

        'address.street': student.address?.street || '',
        'address.city': student.address?.city || '',
        'address.state': student.address?.state || '',
        'address.postalCode': student.address?.postalCode || '',
        'address.country': student.address?.country || '',
      });
      setPhotoFile(null);
      setPhotoPreview('');
      setPhotoError('');
    }
  }, [student, isOpen, reset]);

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

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: `/student/${student._id}`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-detail', student._id] });
      toast.success(res?.message || 'Student updated successfully');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to update student';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');

    const fd = new FormData();
    const scalarFields = [
      'name',
      'dob',
      'gender',
      'bloodGroup',
      'nationality',
      'religion',
      'bForm',
      'placeOfBirth',
      'phone',
      'academicStatus',
      'isActive',
      'feeDiscount',
      'feeWaiver',
      'feeNotes',
    ];
    scalarFields.forEach((k) => {
      const v = data[k];
      if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v));
    });

    // Nested objects — partial-merge supported by backend, only send if any field is filled
    const buildNested = (prefix, keys) => {
      const obj = {};
      let hasAny = false;
      keys.forEach((k) => {
        const v = data[`${prefix}.${k}`];
        if (v !== '' && v !== null && v !== undefined) {
          obj[k] = v;
          hasAny = true;
        }
      });
      return hasAny ? obj : null;
    };

    const father = buildNested('father', [
      'name',
      'cnic',
      'phone',
      'email',
      'occupation',
      'monthlyIncome',
    ]);
    if (father) fd.append('father', JSON.stringify(father));

    const mother = buildNested('mother', ['name', 'cnic', 'phone', 'occupation']);
    if (mother) fd.append('mother', JSON.stringify(mother));

    const emergencyContact = buildNested('emergencyContact', ['name', 'phone', 'relation']);
    if (emergencyContact) fd.append('emergencyContact', JSON.stringify(emergencyContact));

    const address = buildNested('address', ['street', 'city', 'state', 'postalCode', 'country']);
    if (address) fd.append('address', JSON.stringify(address));

    if (photoFile) fd.append('photo', photoFile);

    mutation.mutate(fd);
  };

  if (!student) return null;

  const currentPhoto = student.photo || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Student"
      subtitle={`Updating ${student.user?.name || 'student'} — only filled fields will change`}
      size="xl"
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
          Email, password, class, section, admission number, roll number and academic year cannot be
          changed here. Use the Transfer action to change class or section.
        </div>

        {/* Basic */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Basic Info
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.name?.message}>
              <input {...register('name')} placeholder="Ahmed Khan" className={inputCls} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="+923001234567" className={inputCls} />
            </Field>
            <Field label="Date of Birth" error={errors.dob?.message}>
              <input {...register('dob')} type="date" className={inputCls} />
            </Field>
            <Field label="Gender" error={errors.gender?.message}>
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
            <Field label="Academic Status" error={errors.academicStatus?.message}>
              <select
                {...register('academicStatus')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
              >
                <option value="">Select...</option>
                {ACADEMIC_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" error={errors.isActive?.message}>
              <select {...register('isActive')} className={`${inputCls} bg-white dark:bg-gray-900`}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Father */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Father
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <input {...register('father.name')} className={inputCls} />
            </Field>
            <Field label="CNIC">
              <input {...register('father.cnic')} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input {...register('father.phone')} className={inputCls} />
            </Field>
            <Field label="Email">
              <input {...register('father.email')} type="email" className={inputCls} />
            </Field>
            <Field label="Occupation">
              <input {...register('father.occupation')} className={inputCls} />
            </Field>
            <Field label="Monthly Income">
              <input
                {...register('father.monthlyIncome')}
                type="number"
                min="0"
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name">
              <input {...register('mother.name')} className={inputCls} />
            </Field>
            <Field label="CNIC">
              <input {...register('mother.cnic')} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input {...register('mother.phone')} className={inputCls} />
            </Field>
            <Field label="Occupation">
              <input {...register('mother.occupation')} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Emergency Contact
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Name">
              <input {...register('emergencyContact.name')} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input {...register('emergencyContact.phone')} className={inputCls} />
            </Field>
            <Field label="Relation">
              <input {...register('emergencyContact.relation')} className={inputCls} />
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
              <Field label="Street">
                <input {...register('address.street')} className={inputCls} />
              </Field>
            </div>
            <Field label="City">
              <input {...register('address.city')} className={inputCls} />
            </Field>
            <Field label="State / Province">
              <input {...register('address.state')} className={inputCls} />
            </Field>
            <Field label="Postal Code">
              <input {...register('address.postalCode')} className={inputCls} />
            </Field>
            <Field label="Country">
              <input {...register('address.country')} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Fees */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Fees
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount (%)" error={errors.feeDiscount?.message}>
              <input
                {...register('feeDiscount')}
                type="number"
                min="0"
                max="100"
                className={inputCls}
              />
            </Field>
            <Field label="Full Waiver">
              <select
                {...register('feeWaiver')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Notes">
                <input {...register('feeNotes')} className={inputCls} />
              </Field>
            </div>
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
