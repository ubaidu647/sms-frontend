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
import { generateObjectId } from '@/utils/generateObjectId';
// Validation schema
const organizationSchema = yup.object().shape({
  name: yup.string().required('School name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string(),
  packageId: yup.string().required(),
  status: yup.string().required(),
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
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(organizationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      packageId: '691b63ae069855041a3c6655',
      status: 'active',
      password: '',
    },
  });

  const [successState, setSuccessState] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, reset]);

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
    createSchoolMutation.mutate(data);
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
          <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm flex items-start gap-3">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Package <span className="text-red-500">*</span>
            </label>
            <select
              {...register('packageId')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            >
              <option value="691b63ae069855041a3c6655">Basic</option>
              <option value="691b63ae069855041a3c6655">Standard</option>
              <option value="691b63ae069855041a3c6655">Premium</option>
              <option value="691b63ae069855041a3c6655">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
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
