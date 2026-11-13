'use client';
// Library limits and fines for a branch or the school default.
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/component/Button';
import QueryErrorState from '@/component/QueryErrorState';
import { putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import {
  MAX_LOAN_DAYS,
  SETTINGS_SOURCE_LABELS,
  buildSettingsPayload,
  settingsToForm,
} from '@/utils/library';
import { BranchSelect } from '../leave/LeavePickers';
import {
  Spinner,
  cardCls,
  errorCls,
  inputCls,
  labelCls,
  useLibrarySettings,
} from './libraryShared';
import { useSchoolCurrency } from '@/hooks/useSchoolCurrency';

const SOURCE_COLORS = {
  branch: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  school: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  default: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const num = (label) =>
  yup
    .number()
    .typeError(`${label} must be a number`)
    .transform((v, orig) => (orig === '' ? undefined : v));

const schema = yup.object().shape({
  studentMaxBooks: num('Max books').required('Required').integer().min(1).max(50),
  studentLoanDays: num('Loan days').required('Required').integer().min(1).max(MAX_LOAN_DAYS),
  staffMaxBooks: num('Max books').required('Required').integer().min(1).max(50),
  staffLoanDays: num('Loan days').required('Required').integer().min(1).max(MAX_LOAN_DAYS),
  finePerDay: num('Fine per day').required('Required').min(0).max(100000),
  maxFinePerLoan: num('Max fine').nullable().min(0).max(1000000),
  graceDays: num('Grace days').required('Required').integer().min(0).max(30),
});

const SCHOOL = '';

export default function SettingsPanel({ orgTier, userBranchId }) {
  const { symbol: currencySymbol } = useSchoolCurrency();
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  // Org tier: '' = school default, else a branch. Branch tier: own branch only.
  const [target, setTarget] = useState(orgTier ? SCHOOL : userBranchId);
  const branchId = orgTier ? target : userBranchId;
  const isSchoolDefault = orgTier && target === SCHOOL;
  const { settings, source, isLoading, error, data } = useLibrarySettings(branchId);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: yupResolver(schema), defaultValues: settingsToForm(settings) });

  useEffect(() => {
    if (data) reset(settingsToForm(settings));
    setSubmitError('');
  }, [data, settings, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: '/library/settings', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Library settings saved');
      queryClient.invalidateQueries({ queryKey: ['library-settings'] });
      queryClient.invalidateQueries({ queryKey: ['library-borrower'] });
    },
    onError: (err) => {
      setSubmitError(err.message || 'Could not save settings');
      toast.error(err.message || 'Could not save settings');
    },
  });

  const onSubmit = (values) => {
    setSubmitError('');
    mutation.mutate(buildSettingsPayload(values, isSchoolDefault ? null : branchId));
  };

  const inherits = !isSchoolDefault && source !== 'branch';

  const field = (name, label, props = {}) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input type="number" {...register(name)} className={inputCls} {...props} />
      {errors[name] && <p className={errorCls}>{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      {orgTier && (
        <div className={cardCls}>
          <label className={labelCls}>Settings for</label>
          <BranchSelect
            value={target}
            onChange={setTarget}
            allLabel="School default (all branches)"
          />
        </div>
      )}

      {error ? (
        <QueryErrorState error={error} fallback="Could not load library settings" />
      ) : isLoading ? (
        <div className={`${cardCls} p-10 flex justify-center`}>
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className={`${cardCls} space-y-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {isSchoolDefault ? 'School default' : 'Branch settings'}
            </h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                SOURCE_COLORS[source] || SOURCE_COLORS.default
              }`}
            >
              Source: {SETTINGS_SOURCE_LABELS[source] || source}
            </span>
          </div>
          {inherits && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This branch currently uses the {SETTINGS_SOURCE_LABELS[source]?.toLowerCase()}. Saving
              creates settings specific to this branch.
            </p>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Students
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {field('studentMaxBooks', 'Max books at once', { min: 1 })}
              {field('studentLoanDays', 'Loan days', { min: 1, max: MAX_LOAN_DAYS })}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Staff
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {field('staffMaxBooks', 'Max books at once', { min: 1 })}
              {field('staffLoanDays', 'Loan days', { min: 1, max: MAX_LOAN_DAYS })}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Late fines
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {field('finePerDay', `Fine per day (${currencySymbol})`, { min: 0, step: '0.01' })}
              {field('maxFinePerLoan', `Max fine per loan (${currencySymbol}, blank = no cap)`, {
                min: 0,
                step: '0.01',
              })}
              {field('graceDays', 'Grace days', { min: 0 })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Fine = (days late − grace days) × fine per day, capped by the max. Students&apos;
              unpaid fines are added to their next fee voucher; staff fines are only recorded.
            </p>
          </fieldset>

          {submitError && <p className={errorCls}>{submitError}</p>}
          <div className="flex justify-end">
            <Button
              type="submit"
              label="Save settings"
              loading={mutation.isPending}
              styleObject={{
                baseColor: isDirty || inherits ? 'bg-teal-600' : 'bg-teal-600/70',
                hoverColor: 'hover:bg-teal-700',
                rounded: 'rounded-full',
                size: 'px-8 py-3 text-md min-h-[3rem]',
                textColor: 'text-white',
              }}
            />
          </div>
        </form>
      )}
    </div>
  );
}
