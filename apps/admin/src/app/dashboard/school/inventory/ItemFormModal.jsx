'use client';
// Add / edit an inventory item (school-wide catalogue; stock is per branch).
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { ITEM_UNITS, isMoneyInput, fromPaisa, toPaisa } from '@/utils/inventory';
import { errorCls, inputCls, invalidateInventoryStock, labelCls } from './inventoryShared';
import { useSchoolCurrency } from '@/hooks/useSchoolCurrency';

const schema = yup.object().shape({
  name: yup.string().trim().required('Name is required').max(200),
  sku: yup.string().trim().max(40, 'At most 40 characters'),
  category: yup.string().trim().max(100),
  unit: yup.string().trim().required('Unit is required').max(20, 'At most 20 characters'),
  reorderLevel: yup
    .string()
    .test('rl', 'Enter 0 or more (max 2 decimals)', (v) => !v || /^\d+(\.\d{1,2})?$/.test(v)),
  isSaleable: yup.boolean(),
  salePrice: yup.string().when('isSaleable', {
    is: true,
    then: (s) =>
      s.test(
        'price',
        'Sale price is required for a saleable item',
        (v) => isMoneyInput(v) && toPaisa(v) > 0,
      ),
    otherwise: (s) => s.nullable(),
  }),
});

const toForm = (item) => ({
  name: item?.name || '',
  sku: item?.sku || '',
  category: item?.category || '',
  unit: item?.unit || 'pcs',
  reorderLevel: item?.reorderLevel !== undefined ? String(item.reorderLevel) : '0',
  isSaleable: !!item?.isSaleable,
  salePrice: item?.salePrice ? String(item.salePrice) : '',
});

export default function ItemFormModal({ isOpen, onClose, item }) {
  const { symbol: currencySymbol } = useSchoolCurrency();
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const isCreate = !item;
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: toForm(item) });

  useEffect(() => {
    if (isOpen) {
      reset(toForm(item));
      setSubmitError('');
    }
  }, [isOpen, item, reset]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isCreate
        ? postData({ url: '/inventory/items', payload, token })
        : putData({ url: `/inventory/items/${item._id}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isCreate ? 'Item added' : 'Item updated'));
      invalidateInventoryStock(queryClient);
      onClose();
    },
    onError: (err) => {
      setSubmitError(err.message || 'Could not save the item');
      toast.error(err.message || 'Could not save the item');
    },
  });

  const onSubmit = (v) => {
    setSubmitError('');
    const payload = {
      name: v.name.trim(),
      category: (v.category || '').trim(),
      unit: v.unit.trim(),
      reorderLevel: Number(v.reorderLevel) || 0,
      isSaleable: !!v.isSaleable,
    };
    const sku = (v.sku || '').trim();
    if (sku || !isCreate) payload.sku = sku;
    if (v.isSaleable) payload.salePrice = fromPaisa(toPaisa(v.salePrice));
    mutation.mutate(payload);
  };

  const saleable = watch('isSaleable');
  const field = (name, label, props = {}) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input {...register(name)} className={inputCls} {...props} />
      {errors[name] && <p className={errorCls}>{errors[name].message}</p>}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'Add item' : 'Edit item'}
      footer={
        <div className="flex gap-3">
          <Button
            label="Cancel"
            handleClick={onClose}
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label={isCreate ? 'Add item' : 'Save'}
            loading={mutation.isPending}
            handleClick={handleSubmit(onSubmit)}
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">{field('name', 'Name *')}</div>
          {field('sku', 'SKU', { placeholder: 'Auto (ITM-0001) when blank' })}
          {field('category', 'Category', { placeholder: 'e.g. Stationery, Uniform' })}
          {field('unit', 'Unit *', { list: 'inventory-units', placeholder: 'pcs' })}
          {field('reorderLevel', 'Reorder level', { inputMode: 'decimal' })}
          <datalist id="inventory-units">
            {ITEM_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="inv-saleable"
              {...register('isSaleable')}
              className="w-4 h-4"
            />
            <label htmlFor="inv-saleable" className="text-sm text-gray-700 dark:text-gray-300">
              Sold in the school shop
            </label>
          </div>
          {saleable &&
            field('salePrice', `Sale price (${currencySymbol}) *`, { inputMode: 'decimal' })}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Stock is added through purchases (or adjustments); the item is shown as low stock when a
          branch holds the reorder level or less.
        </p>
        {submitError && <p className={errorCls}>{submitError}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
