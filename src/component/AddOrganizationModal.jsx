'use client';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import InputField from './InputField';
import Button from './Button';
import { Building2, Mail, Phone, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postData } from '@/utils/api';
import { useOrganizationStore } from '../app/dashboard/system/organizations/store/organizationStore';
import { usePackages } from '../app/dashboard/system/packages/hooks/usePackages';
import { fmtMoney } from '../app/dashboard/system/packages/format';
// Validation schema
const organizationSchema = yup.object().shape({
  name: yup.string().required('School name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string(),
  packageId: yup.string().required('Please choose a package'),
  status: yup.string().required(),
  gracePeriodInDays: yup
    .string()
    .test('grace', 'Grace period must be a whole number (0 or more)', (v) => {
      if (v === '' || v == null) return true;
      const n = Number(v);
      return Number.isInteger(n) && n >= 0;
    }),
  password: yup.string().min(6, 'Password must be at least 6 characters'),
});

export const AddOrganizationModal = ({ isOpen, onClose, token, onSuccess = null }) => {
  const queryClient = useQueryClient();
  const { addOrganization } = useOrganizationStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(organizationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      packageId: '',
      status: 'active',
      gracePeriodInDays: '0',
      password: '',
    },
  });

  // Real, active packages — the chosen one is frozen into the school's first
  // subscription on the backend, so the list must come from the catalog.
  const { data: pkgData, isLoading: pkgLoading } = usePackages({
    limit: 100,
    filters: { isActive: true },
    enabled: isOpen,
  });
  const packages = pkgData?.data ?? [];
  const selectedPackageId = watch('packageId');

  const [successState, setSuccessState] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, reset]);

  // Default to the first package once the catalog loads (no hardcoded id).
  useEffect(() => {
    const list = pkgData?.data ?? [];
    if (isOpen && !selectedPackageId && list.length > 0) {
      setValue('packageId', list[0]._id, { shouldValidate: true });
    }
  }, [isOpen, selectedPackageId, pkgData, setValue]);

  // Mutation to create a school
  const createSchoolMutation = useMutation({
    mutationFn: (payload) =>
      postData({
        url: '/schools',
        payload,
        token,
      }),

    onSuccess: (newSchool) => {
      addOrganization(newSchool.data);
      console.log('newSchool', newSchool.data);
      queryClient.setQueryData(['organizations'], (oldData) => {
        if (!oldData) return [newSchool.data];
        return [newSchool.data, ...oldData];
      });

      onSuccess?.(newSchool.data);
      setSuccessState(true);
      toast.success('School created successfully!');
      reset();
      onClose();
    },
    onError: (error) => {
      console.log('111', error);
      setSubmitError(error.message || 'Failed to create school');
      toast.error(error.message);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    setSuccessState(false);
    // Omit grace when blank (→ backend default 0); otherwise send a number.
    const payload = { ...data };
    if (payload.gracePeriodInDays === '' || payload.gracePeriodInDays == null) {
      delete payload.gracePeriodInDays;
    } else {
      payload.gracePeriodInDays = Number(payload.gracePeriodInDays);
    }
    createSchoolMutation.mutate(payload);
  };

  const handleCancel = () => {
    reset();
    setSubmitError('');
    setSuccessState(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Create New School"
      subtitle="Fill in the details to add a new school to your system"
      size="30vw"
      footer={
        <div className="flex gap-3 w-full">
          <Button label="Cancel" handleClick={handleCancel} variant="secondary" type="button" />
          {/* <Button
            label="Create School"
            styleObject={{
              baseColor: 'bg-black',
              hoverColor: 'hover:bg-gray-800',
              animation:
                'transform transition-all duration-500 ease-in-out transform origin-center',
              rounded: 'rounded-full',
              size: 'px-10 py-1 text-md min-h-[2.5rem]',
              textColor: 'text-white',
            }}
            loading={createSchoolMutation.isLoading}
            success={successState}
            handleClick={handleSubmit(onSubmit)}
          /> */}
          <Button
            label="Create School"
            styleObject={{
              baseColor: 'bg-black',
              hoverColor: 'hover:bg-gray-800',
              animation: 'transform transition-all duration-500 ease-in-out',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]', // ← Increased height for spinner
              textColor: 'text-white',
            }}
            loading={createSchoolMutation.isPending || createSchoolMutation.isLoading} // safer
            success={successState}
            handleClick={handleSubmit(onSubmit)}
            // ADD THIS: Override the destructive !px-2 when loading
            className={createSchoolMutation.isLoading ? 'px-10' : ''}
          />
        </div>
      }
    >
      <form className="space-y-5">
        {submitError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>{submitError}</div>
          </div>
        )}

        <InputField
          name="name"
          label="School Name"
          required
          watch={watch}
          errors={errors}
          register={register}
          icon={Building2}
        />
        <InputField
          name="email"
          label="Email Address"
          type="email"
          required
          watch={watch}
          errors={errors}
          register={register}
          icon={Mail}
        />
        <InputField
          name="phone"
          label="Phone Number"
          type="tel"
          watch={watch}
          errors={errors}
          register={register}
          icon={Phone}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Package <span className="text-red-500">*</span>
            </label>
            <select
              {...register('packageId')}
              disabled={pkgLoading || packages.length === 0}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-60"
            >
              {pkgLoading ? (
                <option value="">Loading packages…</option>
              ) : packages.length === 0 ? (
                <option value="">No active packages — create one first</option>
              ) : (
                packages.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {fmtMoney(p.price)} / {p.durationInDays}d
                  </option>
                ))
              )}
            </select>
            {errors.packageId && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.packageId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Grace period (days after expiry)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            {...register('gracePeriodInDays')}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl"
            placeholder="0"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Days the school keeps access after the subscription expires before writes are blocked. 0
            = cut off immediately at expiry.
          </p>
          {errors.gracePeriodInDays && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.gracePeriodInDays.message}
            </p>
          )}
        </div>

        <InputField
          name="password"
          label="Password"
          type="password"
          watch={watch}
          errors={errors}
          register={register}
          showPasswordToggle
          icon={Lock}
        />
      </form>
    </Modal>
  );
};
