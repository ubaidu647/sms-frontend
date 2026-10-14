'use client';
// Public online admission form settings — one form (and one public link) per branch.
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, ExternalLink } from 'lucide-react';
import Button from '@/component/Button';
import Switch from '@/component/Switch';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, postData, putData } from '@/utils/api';
import { currentAcademicYear } from '@/utils/academicYear';
import { useTokenStore } from '@/store/tokenStore';
import {
  CLASS_GRADES,
  GRADE_OPTIONS,
  formForBranch,
  normalizeForms,
  publicApplyUrl,
} from '@/utils/admission';
import {
  BranchSelect,
  Field,
  Spinner,
  cardCls,
  inputCls,
  labelCls,
  modalPrimary,
  secondaryBtn,
} from './admissionShared';
import { yearOptions } from './OverviewPanel';
import ConfirmModal from './ConfirmModal';

const PARENT_PORTAL_URL = process.env.NEXT_PUBLIC_PARENT_PORTAL_URL || 'http://localhost:3003';

const schema = yup.object().shape({
  enabled: yup.boolean(),
  academicYear: yup
    .string()
    .matches(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY')
    .required('Academic year is required'),
  grades: yup
    .array()
    .of(yup.string().oneOf(CLASS_GRADES))
    .when('enabled', {
      is: true,
      then: (s) => s.min(1, 'Offer at least one grade while the form is enabled'),
    }),
  message: yup.string().max(1000, 'Max 1000 characters'),
});

const valuesOf = (form) => ({
  enabled: !!form?.enabled,
  academicYear: form?.academicYear || currentAcademicYear(),
  grades: Array.isArray(form?.grades) ? form.grades : [],
  message: form?.message || '',
});

export default function FormsPanel({ orgTier, userBranchId }) {
  const [pickedBranch, setPickedBranch] = useState('');
  const branchId = orgTier ? pickedBranch : userBranchId;

  return (
    <div className="space-y-4">
      {orgTier && (
        <div className={`${cardCls} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
          <div>
            <label className={labelCls}>Branch</label>
            <BranchSelect
              value={pickedBranch}
              onChange={setPickedBranch}
              allLabel="Select branch..."
            />
          </div>
        </div>
      )}
      {branchId ? (
        <BranchFormEditor key={branchId} branchId={branchId} />
      ) : (
        <div className={`${cardCls} text-sm text-gray-500 dark:text-gray-400`}>
          Pick a branch to manage its online admission form.
        </div>
      )}
    </div>
  );
}

function BranchFormEditor({ branchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [confirmRotate, setConfirmRotate] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admission-forms', branchId],
    queryFn: () => fetchData({ url: '/admission/forms', token, branchId }),
    enabled: !!token && !!branchId,
  });
  const form = formForBranch(normalizeForms(data?.data), branchId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: yupResolver(schema), defaultValues: valuesOf(form) });

  useEffect(() => {
    if (data) reset(valuesOf(form));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const enabled = watch('enabled');
  const grades = watch('grades') || [];

  const save = useMutation({
    mutationFn: (payload) => putData({ url: '/admission/forms', payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admission-forms', branchId] });
      toast.success(res?.message || 'Online form saved');
    },
    onError: (err) => toast.error(err.message || 'Could not save the form'),
  });

  const rotate = useMutation({
    mutationFn: () => postData({ url: `/admission/forms/${branchId}/rotate-key`, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admission-forms', branchId] });
      toast.success(res?.message || 'New link generated');
      setConfirmRotate(false);
    },
    onError: (err) => toast.error(err.message || 'Could not regenerate the link'),
  });

  const onSubmit = (v) =>
    save.mutate({
      branchId,
      enabled: !!v.enabled,
      academicYear: v.academicYear,
      // Keep the enum order regardless of click order.
      grades: CLASS_GRADES.filter((g) => v.grades.includes(g)),
      message: v.message?.trim() || '',
    });

  const toggleGrade = (g) => {
    const next = grades.includes(g) ? grades.filter((x) => x !== g) : [...grades, g];
    setValue('grades', next, { shouldDirty: true, shouldValidate: true });
  };

  const link = publicApplyUrl(PARENT_PORTAL_URL, form);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy — select the link and copy it manually');
    }
  };

  if (error) return <QueryErrorState error={error} fallback="Could not load the online form" />;
  if (isLoading)
    return (
      <div className={cardCls}>
        <Spinner />
      </div>
    );

  const years = Array.from(new Set([...yearOptions(), form?.academicYear].filter(Boolean)));

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Public link</h3>
        {link ? (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={link}
                className={`${inputCls} font-mono`}
                onFocus={(e) => e.target.select()}
              />
              <div className="flex gap-2">
                <button type="button" onClick={copyLink} className={secondaryBtn}>
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <a href={link} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => setConfirmRotate(true)}
                  className={secondaryBtn}
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate link
                </button>
              </div>
            </div>
            {!form?.enabled && (
              <p className="text-xs text-amber-600 mt-2">
                The form is disabled — the link shows “not available” until you enable it.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Save the settings below to create this branch’s public link.
          </p>
        )}
      </div>

      <form className={`${cardCls} space-y-5`} onSubmit={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Accept online applications
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Parents can submit an enquiry through the public link; it appears here as an online
              enquiry.
            </p>
          </div>
          <Switch
            checked={!!enabled}
            onChange={(v) => setValue('enabled', v, { shouldDirty: true, shouldValidate: true })}
            label="Accept online applications"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Academic year" required error={errors.academicYear?.message}>
            <select {...register('academicYear')} className={inputCls}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Grades offered" error={errors.grades?.message}>
          <div className="flex flex-wrap gap-2 mt-1">
            {GRADE_OPTIONS.map((g) => {
              const on = grades.includes(g.value);
              return (
                <label
                  key={g.value}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${
                    on
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <input type="checkbox" checked={on} onChange={() => toggleGrade(g.value)} />
                  {g.label}
                </label>
              );
            })}
          </div>
          <div className="flex gap-3 mt-2 text-xs">
            <button
              type="button"
              className="text-teal-600 hover:underline"
              onClick={() =>
                setValue('grades', [...CLASS_GRADES], { shouldDirty: true, shouldValidate: true })
              }
            >
              Select all
            </button>
            <button
              type="button"
              className="text-gray-500 hover:underline"
              onClick={() => setValue('grades', [], { shouldDirty: true, shouldValidate: true })}
            >
              Clear
            </button>
          </div>
        </Field>

        <Field label="Message shown on the form" error={errors.message?.message}>
          <textarea
            {...register('message')}
            rows={3}
            placeholder="Admissions are open for 2026-2027. Our office will call you within two working days."
            className={inputCls}
          />
        </Field>

        <div className="flex justify-end">
          <Button
            label="Save settings"
            loading={save.isPending}
            handleClick={handleSubmit(onSubmit)}
            styleObject={{ ...modalPrimary, size: 'px-6 py-2.5 text-sm min-h-[2.75rem]' }}
          />
        </div>
        {isDirty && <p className="text-xs text-gray-500 text-right">Unsaved changes</p>}
      </form>

      <ConfirmModal
        isOpen={confirmRotate}
        onClose={() => setConfirmRotate(false)}
        title="Regenerate public link?"
        message="A new link is created and the current one stops working immediately — update it anywhere you've shared it (website, WhatsApp, posters)."
        confirmLabel="Regenerate"
        confirmTone="warning"
        loading={rotate.isPending}
        onConfirm={() => rotate.mutate()}
      />
    </div>
  );
}
