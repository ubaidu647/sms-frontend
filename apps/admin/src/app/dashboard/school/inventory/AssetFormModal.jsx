'use client';
// Register an existing asset (POST /inventory/assets, no ledger entry) or edit
// one (PUT /inventory/assets/:id — each change is appended to its history).
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import { postData, putData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { useTokenStore } from '@/store/tokenStore';
import { ASSET_CONDITIONS, fromPaisa, isMoneyInput, toPaisa } from '@/utils/inventory';
import { BranchSelect, StaffSelect } from '../leave/LeavePickers';
import {
  ModalFooter,
  errorCls,
  fmtDate,
  idOf,
  inputCls,
  invalidateInventoryAssets,
  labelCls,
} from './inventoryShared';

const makeSchema = ({ isCreate, needBranch }) =>
  yup.object().shape({
    branchId: isCreate && needBranch ? yup.string().required('Pick a branch') : yup.string(),
    name: yup.string().trim().required('Name is required').max(200),
    category: yup.string().trim().required('Category is required').max(100),
    location: yup.string().trim().max(100),
    condition: yup.string().oneOf(ASSET_CONDITIONS),
    assignedToStaffId: yup.string(),
    purchaseDate: isCreate ? yup.string().required('Pick the purchase date') : yup.string(),
    cost: isCreate
      ? yup.string().test('cost', 'Enter the cost (0 or more)', (v) => isMoneyInput(v))
      : yup.string(),
    status: yup.string(),
  });

const toForm = (a, branchId) => ({
  branchId: idOf(a?.branchId) || branchId || '',
  name: a?.name || '',
  category: a?.category || '',
  location: a?.location || '',
  condition: a?.condition || 'good',
  assignedToStaffId: idOf(a?.assignedToStaffId) || '',
  purchaseDate: a ? fmtDate(a.purchaseDate) : localYMD(),
  cost: a?.cost !== undefined ? String(a.cost) : '',
  status: a?.status || 'in-use',
});

export default function AssetFormModal({ isOpen, onClose, asset, orgTier, defaultBranchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const isCreate = !asset;
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(makeSchema({ isCreate, needBranch: orgTier })),
    defaultValues: toForm(asset, defaultBranchId),
  });

  useEffect(() => {
    if (isOpen) {
      reset(toForm(asset, defaultBranchId));
      setSubmitError('');
    }
  }, [isOpen, asset, defaultBranchId, reset]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isCreate
        ? postData({ url: '/inventory/assets', payload, token })
        : putData({ url: `/inventory/assets/${asset._id}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isCreate ? 'Asset registered' : 'Asset updated'));
      invalidateInventoryAssets(queryClient);
      onClose();
    },
    onError: (err) => {
      setSubmitError(err.message || 'Could not save the asset');
      toast.error(err.message || 'Could not save the asset');
    },
  });

  const onSubmit = (v) => {
    setSubmitError('');
    const payload = {
      name: v.name.trim(),
      category: v.category.trim(),
      location: (v.location || '').trim(),
      condition: v.condition,
      assignedToStaffId: v.assignedToStaffId || null,
    };
    if (isCreate) {
      if (orgTier && v.branchId) payload.branchId = v.branchId;
      payload.purchaseDate = v.purchaseDate;
      payload.cost = fromPaisa(toPaisa(v.cost));
      payload.status = v.status;
      if (!payload.assignedToStaffId) delete payload.assignedToStaffId;
    }
    mutation.mutate(payload);
  };

  const branchForStaff = isCreate ? watch('branchId') : idOf(asset?.branchId);
  const field = (name, label, props = {}) => (
    <div className={props.wrap || ''}>
      <label className={labelCls}>{label}</label>
      <input
        {...register(name)}
        className={inputCls}
        type={props.type || 'text'}
        {...(props.inputMode ? { inputMode: props.inputMode } : {})}
      />
      {errors[name] && <p className={errorCls}>{errors[name].message}</p>}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'Register existing asset' : `Edit ${asset?.tagNumber || 'asset'}`}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit(onSubmit)}
          submitLabel={isCreate ? 'Register' : 'Save'}
          loading={mutation.isPending}
        />
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isCreate && orgTier && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Branch *</label>
              <BranchSelect
                value={watch('branchId') || ''}
                onChange={(v) => {
                  setValue('branchId', v, { shouldValidate: true });
                  setValue('assignedToStaffId', '');
                }}
                allLabel="Select branch…"
              />
              {errors.branchId && <p className={errorCls}>{errors.branchId.message}</p>}
            </div>
          )}
          {field('name', 'Name *', { wrap: 'sm:col-span-2' })}
          {field('category', 'Category *')}
          {field('location', 'Location / room')}
          <div>
            <label className={labelCls}>Condition</label>
            <select {...register('condition')} className={inputCls}>
              {ASSET_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Assigned to</label>
            <StaffSelect
              value={watch('assignedToStaffId') || ''}
              branchId={branchForStaff || undefined}
              placeholder="Not assigned"
              onChange={(id) => setValue('assignedToStaffId', id)}
            />
          </div>
          {isCreate && (
            <>
              {field('purchaseDate', 'Purchase date *', { type: 'date' })}
              {field('cost', 'Cost (Rs) *', { inputMode: 'decimal' })}
              <div>
                <label className={labelCls}>Status</label>
                <select {...register('status')} className={inputCls}>
                  <option value="in-use">In use</option>
                  <option value="in-store">In store</option>
                  <option value="under-repair">Under repair</option>
                </select>
              </div>
            </>
          )}
        </div>
        {isCreate && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            For assets the school already owns — no ledger entry is posted. Buy new assets through a
            purchase instead.
          </p>
        )}
        {submitError && <p className={errorCls}>{submitError}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
