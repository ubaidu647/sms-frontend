'use client';
// Add / edit a supplier.
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import { postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import {
  ModalFooter,
  errorCls,
  inputCls,
  invalidateInventoryPurchases,
  labelCls,
} from './inventoryShared';

const schema = yup.object().shape({
  name: yup.string().trim().required('Name is required').max(200),
  contactPerson: yup.string().trim().max(100),
  phone: yup.string().trim().max(30),
  email: yup.string().trim().email('Enter a valid email').max(200),
  address: yup.string().trim().max(500),
  notes: yup.string().trim().max(1000),
});

const FIELDS = ['name', 'contactPerson', 'phone', 'email', 'address', 'notes'];
const toForm = (s) => Object.fromEntries(FIELDS.map((k) => [k, s?.[k] || '']));

export default function SupplierFormModal({ isOpen, onClose, supplier }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const isCreate = !supplier;
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: toForm(supplier) });

  useEffect(() => {
    if (isOpen) {
      reset(toForm(supplier));
      setSubmitError('');
    }
  }, [isOpen, supplier, reset]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isCreate
        ? postData({ url: '/inventory/suppliers', payload, token })
        : putData({ url: `/inventory/suppliers/${supplier._id}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isCreate ? 'Supplier added' : 'Supplier updated'));
      invalidateInventoryPurchases(queryClient);
      onClose();
    },
    onError: (err) => {
      setSubmitError(err.message || 'Could not save the supplier');
      toast.error(err.message || 'Could not save the supplier');
    },
  });

  const onSubmit = (v) => {
    setSubmitError('');
    const payload = {};
    FIELDS.forEach((k) => {
      const val = (v[k] || '').trim();
      if (val || !isCreate) payload[k] = val;
    });
    mutation.mutate(payload);
  };

  const field = (name, label, props = {}) => (
    <div className={props.wrap || ''}>
      <label className={labelCls}>{label}</label>
      {props.textarea ? (
        <textarea {...register(name)} rows={2} className={inputCls} />
      ) : (
        <input {...register(name)} className={inputCls} type={props.type || 'text'} />
      )}
      {errors[name] && <p className={errorCls}>{errors[name].message}</p>}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'Add supplier' : 'Edit supplier'}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit(onSubmit)}
          submitLabel={isCreate ? 'Add supplier' : 'Save'}
          loading={mutation.isPending}
        />
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('name', 'Name *', { wrap: 'sm:col-span-2' })}
          {field('contactPerson', 'Contact person')}
          {field('phone', 'Phone')}
          {field('email', 'Email', { type: 'email', wrap: 'sm:col-span-2' })}
          {field('address', 'Address', { textarea: true, wrap: 'sm:col-span-2' })}
          {field('notes', 'Notes', { textarea: true, wrap: 'sm:col-span-2' })}
        </div>
        {submitError && <p className={errorCls}>{submitError}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
