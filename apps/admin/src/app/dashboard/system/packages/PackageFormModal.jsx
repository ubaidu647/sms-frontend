'use client';
import React, { useEffect } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreatePackage, useUpdatePackage } from './hooks/usePackages';

const numberField = (label) =>
  yup
    .number()
    .transform((v, o) => (o === '' || o === null ? undefined : v))
    .typeError(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .required(`${label} is required`);

const schema = yup.object().shape({
  name: yup.string().trim().required('Name is required'),
  description: yup.string().trim(),
  price: numberField('Price'),
  durationInDays: numberField('Duration').integer('Duration must be a whole number'),
  noOfStudents: numberField('Students limit').integer(),
  noOfBranches: numberField('Branches limit').integer(),
  noOfStaffs: numberField('Staff limit').integer(),
  noOfSections: numberField('Sections limit').integer(),
  web: yup.boolean(),
  android: yup.boolean(),
  ios: yup.boolean(),
  staff: yup.boolean(),
  student: yup.boolean(),
  parent: yup.boolean(),
  features: yup.string(), // comma/newline separated; empty = allow ALL
  isActive: yup.boolean(),
});

const EMPTY = {
  name: '',
  description: '',
  price: '',
  durationInDays: 30,
  noOfStudents: '',
  noOfBranches: '',
  noOfStaffs: '',
  noOfSections: '',
  web: true,
  android: true,
  ios: false,
  staff: true,
  student: false,
  parent: false,
  features: '',
  isActive: true,
};

const toFormValues = (pkg) =>
  !pkg
    ? EMPTY
    : {
        name: pkg.name ?? '',
        description: pkg.description ?? '',
        price: pkg.price ?? '',
        durationInDays: pkg.durationInDays ?? 30,
        noOfStudents: pkg.limits?.noOfStudents ?? '',
        noOfBranches: pkg.limits?.noOfBranches ?? '',
        noOfStaffs: pkg.limits?.noOfStaffs ?? '',
        noOfSections: pkg.limits?.noOfSections ?? '',
        web: pkg.platforms?.web ?? true,
        android: pkg.platforms?.android ?? true,
        ios: pkg.platforms?.ios ?? false,
        // Older packages predate dashboards — fall back to the model defaults.
        staff: pkg.dashboards?.staff ?? true,
        student: pkg.dashboards?.student ?? false,
        parent: pkg.dashboards?.parent ?? false,
        features: (pkg.features ?? []).join(', '),
        isActive: pkg.isActive ?? true,
      };

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';
const errCls = 'mt-1 text-xs text-red-600 dark:text-red-400';

export default function PackageFormModal({ isOpen, onClose, pkg = null }) {
  const isEdit = !!pkg;
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const saving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: EMPTY });

  // Re-seed whenever the modal opens or the target package changes.
  useEffect(() => {
    if (isOpen) reset(toFormValues(pkg));
  }, [isOpen, pkg, reset]);

  const onSubmit = (data) => {
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      price: data.price,
      durationInDays: data.durationInDays,
      limits: {
        noOfStudents: data.noOfStudents,
        noOfBranches: data.noOfBranches,
        noOfStaffs: data.noOfStaffs,
        noOfSections: data.noOfSections,
      },
      platforms: { web: !!data.web, android: !!data.android, ios: !!data.ios },
      dashboards: { staff: !!data.staff, student: !!data.student, parent: !!data.parent },
      features: (data.features || '')
        .split(/[\n,]/)
        .map((f) => f.trim())
        .filter(Boolean),
      isActive: !!data.isActive,
    };

    if (isEdit) {
      updateMutation.mutate({ id: pkg._id, payload }, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Package' : 'Create Package'}
      subtitle={
        isEdit
          ? 'Changes affect future subscriptions only — existing schools keep their snapshot.'
          : 'Define a new plan available to schools.'
      }
      size="lg"
      footer={
        <div className="flex gap-3 w-full justify-end">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label={isEdit ? 'Save Changes' : 'Create Package'}
            handleClick={handleSubmit(onSubmit)}
            loading={saving}
            type="button"
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
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className={labelCls}>
            Name <span className="text-red-500">*</span>
          </label>
          <input className={inputCls} placeholder="e.g. Premium" {...register('name')} />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            rows={2}
            className={inputCls}
            placeholder="Short summary of the plan"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              className={inputCls}
              placeholder="5000"
              {...register('price')}
            />
            {errors.price && <p className={errCls}>{errors.price.message}</p>}
          </div>
          <div>
            <label className={labelCls}>
              Duration (days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className={inputCls}
              placeholder="30"
              {...register('durationInDays')}
            />
            {errors.durationInDays && <p className={errCls}>{errors.durationInDays.message}</p>}
          </div>
        </div>

        <div>
          <p className={labelCls}>Limits</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['noOfStudents', 'Students'],
              ['noOfBranches', 'Branches'],
              ['noOfStaffs', 'Staff'],
              ['noOfSections', 'Sections'],
            ].map(([key, lbl]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{lbl}</label>
                <input type="number" className={inputCls} {...register(key)} />
                {errors[key] && <p className={errCls}>{errors[key].message}</p>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className={labelCls}>Platforms</p>
          <div className="flex flex-wrap gap-5">
            {[
              ['web', 'Web'],
              ['android', 'Android'],
              ['ios', 'iOS'],
            ].map(([key, lbl]) => (
              <label
                key={key}
                className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input type="checkbox" className="h-4 w-4 accent-teal-600" {...register(key)} />
                {lbl}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className={labelCls}>Dashboards</p>
          <div className="flex flex-wrap gap-5">
            {[
              ['staff', 'Staff Dashboard'],
              ['student', 'Student Dashboard'],
              ['parent', 'Parent Dashboard'],
            ].map(([key, lbl]) => (
              <label
                key={key}
                className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input type="checkbox" className="h-4 w-4 accent-teal-600" {...register(key)} />
                {lbl}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Features</label>
          <textarea
            rows={2}
            className={inputCls}
            placeholder="Comma or newline separated. Leave empty to allow ALL features."
            {...register('features')}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Empty = allow all features.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" className="h-4 w-4 accent-teal-600" {...register('isActive')} />
          Active (available to assign)
        </label>
      </form>
    </Modal>
  );
}
