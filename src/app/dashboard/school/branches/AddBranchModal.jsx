'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import InputField from '@/component/InputField';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

const branchSchema = yup.object().shape({
  name: yup.string().required('Branch name is required'),
  address: yup.string(),
  email: yup.string().email('Invalid email'),
  phone: yup.string(),
  managerName: yup.string(),
  status: yup.string().required(),
});

export const AddBranchModal = ({ isOpen, onClose, onSuccess = null }) => {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      email: '',
      phone: '',
      managerName: '',
      status: 'active',
    },
  });

  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
    }
  }, [isOpen, reset]);

  const createBranchMutation = useMutation({
    mutationFn: (payload) => postData({ url: '/branch/create', payload, token }),
    onSuccess: (res) => {
      const branch = res?.data || res; // account for different shapes
      // update any queries if needed
      queryClient.invalidateQueries(['branches']);
      toast.success(res?.message || 'Branch created');
      onSuccess?.(branch);
      setSuccessState(true);
      // small delay to show success state
      setTimeout(() => setSuccessState(false), 1200);
      reset();
      onClose();
    },
    onError: (error) => {
      setSubmitError(error.message || 'Failed to create branch');
      toast.error(error.message || 'Failed to create branch');
      setSuccessState(false);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    createBranchMutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    setSubmitError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Create New Branch"
      subtitle="Fill in the details to add a new branch"
      size="30vw"
      footer={
        <div className="flex gap-3 w-full">
          <Button label="Cancel" handleClick={handleCancel} variant="secondary" type="button" />
          <Button
            label="Create Branch"
            styleObject={{
              baseColor: 'bg-black',
              hoverColor: 'hover:bg-gray-800',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={createBranchMutation.isPending || createBranchMutation.isLoading}
            success={successState}
            handleClick={handleSubmit(onSubmit)}
          />
        </div>
      }
    >
      <form className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <InputField
          name="name"
          label="Branch Name"
          register={register}
          watch={watch}
          errors={errors}
          required
        />
        <InputField
          name="address"
          label="Address"
          register={register}
          watch={watch}
          errors={errors}
        />
        <InputField name="email" label="Email" register={register} watch={watch} errors={errors} />
        <InputField name="phone" label="Phone" register={register} watch={watch} errors={errors} />
        <InputField
          name="managerName"
          label="Manager Name"
          register={register}
          watch={watch}
          errors={errors}
        />

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
      </form>
    </Modal>
  );
};

export default AddBranchModal;
