'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Scale, Plus, Save } from 'lucide-react';
import { fetchData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import { STAFF_TYPES } from '@/constants/staffSalary';
import { useTranslations } from 'next-intl';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';
const sectionTitleCls = 'text-xs font-bold text-gray-500 uppercase tracking-widest mb-3';

const STAFF_TYPE_LABELS = {
  teaching: 'Teaching Staff',
  'non-teaching': 'Non-Teaching Staff',
};

const DEFAULTS = {
  workingDaysPerMonth: 26,
  freeAbsencesPerMonth: 0,
  absentDeductionMode: 'per-day',
  absentDeductionMultiplier: 1,
  absentDeductionAmount: 0,
  freeLatesPerMonth: 0,
  lateGroupSize: 3,
  lateDeductionDays: 0.5,
  halfDayDeductionFactor: 0.5,
  unpaidLeaveDeductionFactor: 1,
  paidLeaveDeductionFactor: 0,
  overtimeBonusPerHour: 0,
  perfectAttendanceBonus: 0,
  isActive: true,
};

const toForm = (policy) => {
  const base = { ...DEFAULTS };
  if (!policy) return base;
  for (const k of Object.keys(DEFAULTS)) {
    if (policy[k] !== undefined && policy[k] !== null) base[k] = policy[k];
  }
  return base;
};

const validateForm = (f) => {
  if (!(f.workingDaysPerMonth >= 1 && f.workingDaysPerMonth <= 31))
    return 'Working days per month must be between 1 and 31';
  if (!(f.freeAbsencesPerMonth >= 0 && f.freeAbsencesPerMonth <= 31))
    return 'Free absences must be between 0 and 31';
  if (f.lateGroupSize < 1) return 'Late group size must be at least 1';
  const nonNeg = [
    ['absentDeductionMultiplier', 'Absent multiplier'],
    ['absentDeductionAmount', 'Absent amount'],
    ['freeLatesPerMonth', 'Free lates'],
    ['lateDeductionDays', 'Late deduction days'],
    ['overtimeBonusPerHour', 'Overtime bonus'],
    ['perfectAttendanceBonus', 'Perfect attendance bonus'],
  ];
  for (const [k, label] of nonNeg) {
    if (f[k] < 0) return `${label} must be ≥ 0`;
  }
  const factors = [
    ['halfDayDeductionFactor', 'Half-day factor'],
    ['unpaidLeaveDeductionFactor', 'Unpaid-leave factor'],
    ['paidLeaveDeductionFactor', 'Paid-leave factor'],
  ];
  for (const [k, label] of factors) {
    if (!(f[k] >= 0 && f[k] <= 1)) return `${label} must be between 0 and 1`;
  }
  return null;
};

export default function StaffSalaryPolicyPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const t = useTranslations('salaryPolicy');

  const scope = resolveScope(user?.role, 'view-staff-salary-policy');
  const isOrgLevel = scope === 'all';
  const canView = scope === 'all' || scope === 'branch';
  const canEdit = hasAnyAction(user?.role, [
    'update-staff-salary-policy',
    'update-all-branch-staff-salary-policy',
    'create-staff-salary-policy',
    'create-all-branch-staff-salary-policy',
  ]);

  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [tab, setTab] = useState(STAFF_TYPES[0]);
  const [branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [form, setForm] = useState(toForm(null));
  const [creating, setCreating] = useState(false);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 200, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const policyKey = ['staff-salary-policy', effectiveBranchId, tab];
  const { data: policyResp, isFetching } = useQuery({
    queryKey: policyKey,
    queryFn: () =>
      fetchData({
        url: '/staff-salary/policy',
        token,
        branchId: effectiveBranchId,
        staffType: tab,
      }),
    enabled: !!token && !!effectiveBranchId && canView,
  });
  const policy = policyResp?.data ?? null;

  // Hydrate form from server, or reset when there's no policy yet.
  useEffect(() => {
    setCreating(false);
    setForm(toForm(policy));
  }, [policy, effectiveBranchId, tab]);

  const initialForm = useMemo(() => toForm(policy), [policy]);
  const isDirty = useMemo(
    () => Object.keys(DEFAULTS).some((k) => String(form[k]) !== String(initialForm[k])),
    [form, initialForm],
  );

  const saveMut = useMutation({
    mutationFn: (payload) => putData({ url: '/staff-salary/policy', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Policy saved');
      queryClient.invalidateQueries({ queryKey: policyKey });
      setCreating(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to save policy'),
  });

  const onSave = () => {
    if (!effectiveBranchId) {
      toast.error('Pick a branch first');
      return;
    }
    const err = validateForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    saveMut.mutate({
      branchId: effectiveBranchId,
      staffType: tab,
      ...form,
    });
  };

  if (!canView) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          You don&apos;t have permission to view salary policies.
        </div>
      </div>
    );
  }

  const showForm = !!policy || creating;
  const formDisabled = !canEdit;

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Scale className="w-7 h-7 text-teal-600" />
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{t('subtitle')}</p>
          </div>
        </div>

        {/* Branch picker (org-level only) */}
        {isOrgLevel && (
          <div className="mb-4">
            <label className={labelCls}>Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className={inputCls + ' max-w-sm'}
            >
              <option value="">Select branch…</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Staff type tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          {STAFF_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {STAFF_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {!effectiveBranchId ? (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 p-4 text-sm text-blue-800 dark:text-blue-300">
            Pick a branch to view or edit its policy.
          </div>
        ) : isFetching && !policy ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading policy…</div>
        ) : !showForm ? (
          <EmptyState
            staffTypeLabel={STAFF_TYPE_LABELS[tab]}
            canEdit={canEdit}
            onCreate={() => {
              setForm(toForm(null));
              setCreating(true);
            }}
          />
        ) : (
          <PolicyForm form={form} setForm={setForm} disabled={formDisabled} isNew={!policy} />
        )}

        {showForm && effectiveBranchId && (
          <div className="flex items-center justify-end gap-3 mt-8">
            {creating && (
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setForm(toForm(policy));
                }}
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={formDisabled || saveMut.isPending || (!creating && !isDirty)}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saveMut.isPending ? 'Saving…' : policy ? 'Save Changes' : 'Create Policy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ staffTypeLabel, canEdit, onCreate }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/40 mx-auto flex items-center justify-center mb-3">
        <Scale className="w-6 h-6 text-teal-600" />
      </div>
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        No {staffTypeLabel.toLowerCase()} policy yet
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
        Until a policy is set, payslip generation falls back to a simple pro-rate (basic / working
        days × unpaid days).
      </p>
      {canEdit && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-full hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Create policy
        </button>
      )}
    </div>
  );
}

function PolicyForm({ form, setForm, disabled, isNew }) {
  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((prev) => ({
      ...prev,
      [k]: v === '' ? '' : Number(v),
    }));
  };
  const setMode = (mode) => setForm((prev) => ({ ...prev, absentDeductionMode: mode }));

  return (
    <div className="space-y-6">
      {isNew && (
        <div className="rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 p-3 text-sm text-teal-800">
          Defaults shown below — adjust and click <strong>Create Policy</strong> to save.
        </div>
      )}

      {/* Working days */}
      <Section title="Working Days">
        <Field
          label="Working days per month"
          hint="Used as the denominator for the per-day rate (basic ÷ working days)."
        >
          <input
            type="number"
            min={1}
            max={31}
            disabled={disabled}
            value={form.workingDaysPerMonth}
            onChange={set('workingDaysPerMonth')}
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Absent rules */}
      <Section title="Absent Rules">
        <Field
          label="Free absences per month"
          hint="The first N absences each month don't deduct from pay."
        >
          <input
            type="number"
            min={0}
            max={31}
            disabled={disabled}
            value={form.freeAbsencesPerMonth}
            onChange={set('freeAbsencesPerMonth')}
            className={inputCls}
          />
        </Field>

        <Field label="Deduction mode">
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                disabled={disabled}
                checked={form.absentDeductionMode === 'per-day'}
                onChange={() => setMode('per-day')}
              />
              Per-day rate
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                disabled={disabled}
                checked={form.absentDeductionMode === 'fixed'}
                onChange={() => setMode('fixed')}
              />
              Fixed amount
            </label>
          </div>
        </Field>

        {form.absentDeductionMode === 'per-day' ? (
          <Field
            label="Per-day multiplier"
            hint="Each billable absence = perDayRate × multiplier. 1.0 means full day."
          >
            <input
              type="number"
              step="0.1"
              min={0}
              disabled={disabled}
              value={form.absentDeductionMultiplier}
              onChange={set('absentDeductionMultiplier')}
              className={inputCls}
            />
          </Field>
        ) : (
          <Field
            label="Fixed amount per absence"
            hint="Each billable absence deducts this exact amount."
          >
            <input
              type="number"
              min={0}
              disabled={disabled}
              value={form.absentDeductionAmount}
              onChange={set('absentDeductionAmount')}
              className={inputCls}
            />
          </Field>
        )}
      </Section>

      {/* Late rules */}
      <Section title="Late Rules">
        <Field label="Free lates per month" hint="Lates this many or fewer per month don't deduct.">
          <input
            type="number"
            min={0}
            disabled={disabled}
            value={form.freeLatesPerMonth}
            onChange={set('freeLatesPerMonth')}
            className={inputCls}
          />
        </Field>
        <Field label="Lates per group" hint="Every N billable lates count as one late-group.">
          <input
            type="number"
            min={1}
            disabled={disabled}
            value={form.lateGroupSize}
            onChange={set('lateGroupSize')}
            className={inputCls}
          />
        </Field>
        <Field label="Days deducted per group" hint="0.5 = half-day deduction per group.">
          <input
            type="number"
            step="0.1"
            min={0}
            disabled={disabled}
            value={form.lateDeductionDays}
            onChange={set('lateDeductionDays')}
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Half-day & leaves */}
      <Section title="Half-day & Leaves">
        <Field label="Half-day factor" hint="0.5 = each half-day deducts half a day's pay.">
          <input
            type="number"
            step="0.1"
            min={0}
            max={1}
            disabled={disabled}
            value={form.halfDayDeductionFactor}
            onChange={set('halfDayDeductionFactor')}
            className={inputCls}
          />
        </Field>
        <Field label="Unpaid-leave factor" hint="1.0 = unpaid leave deducts full day's pay.">
          <input
            type="number"
            step="0.1"
            min={0}
            max={1}
            disabled={disabled}
            value={form.unpaidLeaveDeductionFactor}
            onChange={set('unpaidLeaveDeductionFactor')}
            className={inputCls}
          />
        </Field>
        <Field label="Paid-leave factor" hint="0 = paid leave doesn't deduct.">
          <input
            type="number"
            step="0.1"
            min={0}
            max={1}
            disabled={disabled}
            value={form.paidLeaveDeductionFactor}
            onChange={set('paidLeaveDeductionFactor')}
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Bonuses */}
      <Section title="Bonuses">
        <Field label="Overtime bonus per hour">
          <input
            type="number"
            min={0}
            disabled={disabled}
            value={form.overtimeBonusPerHour}
            onChange={set('overtimeBonusPerHour')}
            className={inputCls}
          />
        </Field>
        <Field
          label="Perfect attendance bonus"
          hint="Awarded when the month has zero absences and zero lates."
        >
          <input
            type="number"
            min={0}
            disabled={disabled}
            value={form.perfectAttendanceBonus}
            onChange={set('perfectAttendanceBonus')}
            className={inputCls}
          />
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
      <h3 className={sectionTitleCls}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
