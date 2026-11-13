'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslations } from 'next-intl';
import ConfirmModal from '../organizations/ConfirmModal';
import {
  useCreatePackage,
  useUpdatePackage,
  useSyncPackageSubscriptions,
} from './hooks/usePackages';
import {
  PLAN_FEATURE_KEYS,
  PLAN_MODULE_GROUPS,
  checkedModulesFor,
  enabledPlanFeatures,
  featuresPayload,
} from '@/utils/planFeatures';
import {
  ADDON_RESOURCES,
  MODULE_KEYS,
  addonPriceField,
  addonPriceLabel,
  addonPricesFromForm,
  addonPricesToForm,
  modulePriceField,
  modulePricesFromForm,
  modulePricesToForm,
} from '@/utils/addons';
import { launchOfferFromForm, launchOfferToForm, offerSlotsLeft } from '@/utils/launchOffer';
import { fmtMoney } from './format';

const numberField = (label) =>
  yup
    .number()
    .transform((v, o) => (o === '' || o === null ? undefined : v))
    .typeError(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .required(`${label} is required`);

// Optional add-on price: blank → null (the plan lists no such add-on).
const addonPriceSchema = (label) =>
  yup
    .number()
    .transform((v, o) => (o === '' || o === null ? null : v))
    .nullable()
    .typeError(`${label} add-on price must be a number`)
    .min(0, `${label} add-on price cannot be negative`);

// Optional storage limit in GB: blank → null (unlimited).
const storageSchema = yup
  .number()
  .transform((v, o) => (o === '' || o === null ? null : v))
  .nullable()
  .typeError('Storage must be a number of GB')
  .min(0, 'Storage cannot be negative');

const schema = yup.object().shape({
  name: yup.string().trim().required('Name is required'),
  description: yup.string().trim(),
  price: numberField('Price'),
  durationInDays: numberField('Duration').integer('Duration must be a whole number'),
  noOfStudents: numberField('Students limit').integer(),
  noOfBranches: numberField('Branches limit').integer(),
  noOfStaffs: numberField('Staff limit').integer(),
  noOfSections: numberField('Sections limit').integer(),
  storageGB: storageSchema,
  web: yup.boolean(),
  android: yup.boolean(),
  ios: yup.boolean(),
  staff: yup.boolean(),
  student: yup.boolean(),
  parent: yup.boolean(),
  features: yup.array().of(yup.string()), // ticked add-on module keys
  isActive: yup.boolean(),
  ...Object.fromEntries(
    ADDON_RESOURCES.map(([key]) => [addonPriceField(key), addonPriceSchema(addonPriceLabel(key))]),
  ),
  ...Object.fromEntries(
    MODULE_KEYS.map((key) => [modulePriceField(key), addonPriceSchema('Module')]),
  ),
  // Launch offer: checked and validated in onSubmit (launchOfferFromForm).
  offerOn: yup.boolean(),
  offerActive: yup.boolean(),
  offerPrice: yup.string(),
  offerMaxSchools: yup.string(),
  offerLockDays: yup.string(),
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
  storageGB: '',
  web: true,
  android: true,
  ios: false,
  // Every dashboard is on by default — a plan that forgets to tick them would
  // lock every student and parent out of the school it is assigned to.
  staff: true,
  student: true,
  parent: true,
  // A new plan starts with every add-on ticked; untick what it should not have.
  features: [...PLAN_FEATURE_KEYS],
  isActive: true,
  ...addonPricesToForm(null),
  ...modulePricesToForm(null),
  ...launchOfferToForm(null),
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
        storageGB: pkg.limits?.storageGB ?? '',
        web: pkg.platforms?.web ?? true,
        android: pkg.platforms?.android ?? true,
        ios: pkg.platforms?.ios ?? false,
        // Older packages predate dashboards — fall back to the model defaults.
        staff: pkg.dashboards?.staff ?? true,
        student: pkg.dashboards?.student ?? true,
        parent: pkg.dashboards?.parent ?? true,
        // A legacy list (empty / free text) opens every module: tick them all.
        features: checkedModulesFor(pkg.features),
        isActive: pkg.isActive ?? true,
        ...addonPricesToForm(pkg),
        ...modulePricesToForm(pkg),
        ...launchOfferToForm(pkg),
      };

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';
const errCls = 'mt-1 text-xs text-red-600 dark:text-red-400';

export default function PackageFormModal({ isOpen, onClose, pkg = null }) {
  const isEdit = !!pkg;
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const syncMutation = useSyncPackageSubscriptions();
  const [syncOpen, setSyncOpen] = useState(false);
  const saving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: EMPTY });
  const checkedModules = watch('features') || [];
  const isLegacyList = isEdit && enabledPlanFeatures(pkg.features) === null;
  const setModules = (keys) => setValue('features', keys, { shouldDirty: true });
  const toggleModule = (key) =>
    setModules(
      checkedModules.includes(key)
        ? checkedModules.filter((k) => k !== key)
        : [...checkedModules, key],
    );

  // Re-seed whenever the modal opens or the target package changes.
  useEffect(() => {
    if (isOpen) reset(toFormValues(pkg));
  }, [isOpen, pkg, reset]);

  const offerOn = watch('offerOn');
  const offerMax = watch('offerMaxSchools');
  const claimed = Number(pkg?.launchOffer?.claimed) || 0;

  const onSubmit = (data) => {
    const offer = launchOfferFromForm(data);
    if (offer.error) {
      setError(offer.field, { type: 'manual', message: offer.error });
      return;
    }
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
        // Blank → null: no storage limit.
        storageGB: data.storageGB ?? null,
      },
      platforms: { web: !!data.web, android: !!data.android, ios: !!data.ios },
      dashboards: { staff: !!data.staff, student: !!data.student, parent: !!data.parent },
      // Always a gating list: `core` plus the ticked add-ons.
      features: featuresPayload(data.features),
      isActive: !!data.isActive,
      addonPrices: addonPricesFromForm(data),
      // A module the plan includes is not sold on top of it.
      moduleAddonPrices: modulePricesFromForm(data, data.features),
      // null removes the offer; `claimed` is the server's.
      launchOffer: offer.value,
    };

    if (isEdit) {
      updateMutation.mutate({ id: pkg._id, payload }, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Edit Package' : 'Create Package'}
        subtitle={
          isEdit
            ? 'Changes affect future subscriptions only — use “Apply to existing schools” to push features to schools already on this plan.'
            : 'Define a new plan available to schools.'
        }
        size="lg"
        footer={
          <div className="flex flex-wrap gap-3 w-full justify-end">
            {isEdit && (
              <Button
                label="Apply to existing schools"
                handleClick={() => setSyncOpen(true)}
                type="button"
                styleObject={{
                  baseColor: 'bg-white border border-teal-600',
                  hoverColor: 'hover:bg-teal-50',
                  rounded: 'rounded-full',
                  size: 'px-6 py-3 text-md min-h-[3rem] mr-auto',
                  textColor: 'text-teal-700',
                }}
              />
            )}
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                ['noOfStudents', 'Students'],
                ['noOfBranches', 'Branches'],
                ['noOfStaffs', 'Staff'],
                ['noOfSections', 'Sections'],
              ].map(([key, lbl]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {lbl}
                  </label>
                  <input type="number" className={inputCls} {...register(key)} />
                  {errors[key] && <p className={errCls}>{errors[key].message}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Storage (GB)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={inputCls}
                  placeholder="Unlimited"
                  {...register('storageGB')}
                />
                {errors.storageGB && <p className={errCls}>{errors.storageGB.message}</p>}
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Storage is the total size of files the school may upload. Leave blank for unlimited.
            </p>
          </div>

          <div>
            <p className={labelCls}>Add-on prices (per extra unit, per plan period)</p>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Price of one extra unit for one full plan period. A school buying extras mid-period
              pays for the days left. Leave blank if the plan does not offer that add-on.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {ADDON_RESOURCES.map(([key]) => {
                const field = addonPriceField(key);
                return (
                  <div key={field}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {addonPriceLabel(key)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      placeholder="Not offered"
                      {...register(field)}
                    />
                    {errors[field] && <p className={errCls}>{errors[field].message}</p>}
                  </div>
                );
              })}
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

          <ModulePicker
            checked={checkedModules}
            onToggle={toggleModule}
            onSelectAll={() => setModules([...PLAN_FEATURE_KEYS])}
            onClear={() => setModules([])}
            showLegacyNote={isLegacyList}
          />

          <ModuleAddonPrices
            checked={checkedModules}
            register={register}
            errors={errors}
            days={watch('durationInDays')}
          />

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <input type="checkbox" className="h-4 w-4 accent-teal-600" {...register('offerOn')} />
              Launch offer
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The first schools that start on this plan pay the offer price, and keep it on renewals
              for the lock period. After that they renew at the normal price. A school gets this
              offer once.
            </p>
            {offerOn ? (
              <div className="mt-3 space-y-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-teal-600"
                    {...register('offerActive')}
                  />
                  Active (new schools can claim it)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    ['offerPrice', 'Offer price', '3500', '0.01'],
                    ['offerMaxSchools', 'Max schools', '30', '1'],
                    ['offerLockDays', 'Lock days', '365', '1'],
                  ].map(([field, lbl, ph, step]) => (
                    <div key={field}>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {lbl} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={step}
                        className={inputCls}
                        placeholder={ph}
                        {...register(field)}
                      />
                      {errors[field] && <p className={errCls}>{errors[field].message}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Claimed {claimed} of {offerMax || pkg?.launchOffer?.maxSchools || '-'}
                  {pkg?.launchOffer
                    ? ` · ${offerSlotsLeft({ maxSchools: Number(offerMax) || 0, claimed })} left`
                    : ''}
                  {pkg?.launchOffer?.price != null &&
                    ` · saved price ${fmtMoney(pkg.launchOffer.price)}`}
                </p>
              </div>
            ) : (
              pkg?.launchOffer && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Saving removes the offer. Schools that already claimed it keep their locked price
                  until their lock ends.
                </p>
              )
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" className="h-4 w-4 accent-teal-600" {...register('isActive')} />
            Active (available to assign)
          </label>
        </form>
      </Modal>
      {isEdit && (
        <ConfirmModal
          isOpen={syncOpen}
          onClose={() => setSyncOpen(false)}
          title="Apply to existing schools"
          message={`Push the SAVED features of “${pkg.name}” — limits, platforms, dashboards and feature flags — to every school currently on this plan. Prices, cycle lengths, start/end dates and invoices are not changed. Save any edits first: unsaved changes in this form are not applied.`}
          confirmLabel="Apply to schools"
          confirmTone="warning"
          loading={syncMutation.isPending}
          onConfirm={() => syncMutation.mutate(pkg._id, { onSuccess: () => setSyncOpen(false) })}
        />
      )}
    </>
  );
}

function ModulePicker({ checked, onToggle, onSelectAll, onClear, showLegacyNote }) {
  const t = useTranslations('planModules');
  const linkCls =
    'text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline disabled:opacity-40 disabled:no-underline';
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('title')}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('selectedCount', { count: checked.length, total: PLAN_FEATURE_KEYS.length })}
          </span>
          <button
            type="button"
            className={linkCls}
            onClick={onSelectAll}
            disabled={checked.length === PLAN_FEATURE_KEYS.length}
          >
            {t('selectAll')}
          </button>
          <button
            type="button"
            className={linkCls}
            onClick={onClear}
            disabled={checked.length === 0}
          >
            {t('clear')}
          </button>
        </div>
      </div>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t('coreNote')}</p>
      {showLegacyNote && (
        <p className="mb-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          {t('legacyNote')}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {PLAN_MODULE_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              {t(`groups.${group.id}`)}
            </p>
            <div className="space-y-2">
              {group.keys.map((key) => (
                <label
                  key={key}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-teal-600"
                    checked={checked.includes(key)}
                    onChange={() => onToggle(key)}
                  />
                  {t(`modules.${key}`)}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// A price per plan period for each module the plan leaves out, so a school can
// buy it as an add-on. Modules ticked in the plan are hidden.
function ModuleAddonPrices({ checked, register, errors, days }) {
  const t = useTranslations('planModules');
  const sellable = MODULE_KEYS.filter((key) => !checked.includes(key));
  return (
    <div>
      <p className={labelCls}>Module add-on prices (per plan period)</p>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        Price for one module for one full {days || '-'}-day plan period. A school opening it
        mid-period pays for the days left. Leave blank if the module is not sold as an add-on.
        Modules ticked in the plan are included and not listed here.
      </p>
      {sellable.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">The plan includes every module.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sellable.map((key) => {
            const field = modulePriceField(key);
            return (
              <div key={field}>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t(`modules.${key}`)}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  placeholder="Not offered"
                  {...register(field)}
                />
                {errors[field] && <p className={errCls}>{errors[field].message}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
