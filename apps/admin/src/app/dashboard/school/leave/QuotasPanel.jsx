'use client';
// Yearly staff leave quotas per branch (or the school default) for teaching
// and non-teaching staff. Days within quota are paid, beyond it unpaid.
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '@/component/Button';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, putData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { useTokenStore } from '@/store/tokenStore';
import {
  LEAVE_STAFF_TYPES,
  POLICY_SOURCE_LABELS,
  QUOTA_LEAVE_TYPES,
  buildQuotas,
  policyFor,
} from '@/utils/leave';
import { cardCls, errorCls, inputCls, labelCls, leaveTypeLabel } from './leaveShared';
import { BranchSelect } from './LeavePickers';

const SCHOOL = 'school';

const SOURCE_COLORS = {
  branch: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  school: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  none: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

function PolicyCard({ staffType, policy, branchId, isSchoolDefault }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(policy.quotas);
  const [error, setError] = useState('');

  useEffect(() => {
    setValues(policy.quotas);
    setError('');
  }, [policy]);

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: '/leave/policy', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Quotas saved');
      queryClient.invalidateQueries({ queryKey: ['leave-policy'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      queryClient.invalidateQueries({ queryKey: ['leave-my'] });
    },
    onError: (err) => {
      setError(err.message || 'Failed to save quotas');
      toast.error(err.message || 'Failed to save quotas');
    },
  });

  const save = () => {
    setError('');
    const { quotas, error: e } = buildQuotas(values);
    if (e) {
      setError(e);
      return;
    }
    mutation.mutate({ branchId: isSchoolDefault ? null : branchId, staffType, quotas });
  };

  // Viewing a branch that inherits: saving creates a branch-specific override.
  const inherits = !isSchoolDefault && policy.source !== 'branch';

  return (
    <div className={`${cardCls} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
          {staffType} staff
        </h3>
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
            SOURCE_COLORS[policy.source] || SOURCE_COLORS.none
          }`}
        >
          {POLICY_SOURCE_LABELS[policy.source] || policy.source}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {QUOTA_LEAVE_TYPES.map((type) => (
          <div key={type}>
            <label className={labelCls}>{leaveTypeLabel(type)} (days / year)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={values[type] ?? 0}
              onChange={(e) => setValues((v) => ({ ...v, [type]: e.target.value }))}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      {inherits && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This branch has no own quotas yet — saving creates a branch-specific policy.
        </p>
      )}
      {error && <p className={errorCls}>{error}</p>}
      <div className="flex justify-end">
        <Button
          label="Save quotas"
          handleClick={save}
          loading={mutation.isPending}
          styleObject={{
            baseColor: 'bg-teal-600',
            hoverColor: 'hover:bg-teal-700',
            rounded: 'rounded-lg',
            size: 'px-5 py-2 text-sm min-h-[2.5rem]',
            textColor: 'text-white',
          }}
        />
      </div>
    </div>
  );
}

export default function QuotasPanel({ orgTier, userBranchId }) {
  const { accessToken: token } = useTokenStore();
  const [picked, setPicked] = useState(orgTier ? SCHOOL : userBranchId);
  const isSchoolDefault = orgTier && picked === SCHOOL;
  const branchId = orgTier ? (isSchoolDefault ? '' : picked) : userBranchId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['leave-policy', isSchoolDefault ? SCHOOL : branchId],
    queryFn: () => fetchData({ url: '/leave/policy', token, ...(branchId ? { branchId } : {}) }),
    enabled: !!token && (isSchoolDefault || !!branchId),
    retry: retryUnless4xx,
  });
  const policyData = data?.data;
  // Memoised so a card's local edits aren't reset on every render.
  const policies = useMemo(
    () => LEAVE_STAFF_TYPES.map((st) => policyFor(policyData, st)),
    [policyData],
  );

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {orgTier && (
            <div>
              <label className={labelCls}>Applies to</label>
              <BranchSelectWithDefault value={picked} onChange={setPicked} />
            </div>
          )}
          <p className="md:col-span-2 text-xs text-gray-500 dark:text-gray-400">
            Quotas are days per leave year (academic year). A branch without its own policy uses the
            school default; with neither, every quota is zero. Unpaid leave never uses quota.
          </p>
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load leave quotas" />
      ) : isLoading || !policyData ? (
        !branchId && !isSchoolDefault ? (
          <div className={`${cardCls} text-center text-sm text-gray-500`}>
            Your account is not assigned to a branch.
          </div>
        ) : (
          <div className={`${cardCls} p-12 flex justify-center`}>
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {policies.map((policy) => (
            <PolicyCard
              key={`${picked}-${policy.staffType}`}
              staffType={policy.staffType}
              policy={policy}
              branchId={branchId}
              isSchoolDefault={isSchoolDefault}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BranchSelectWithDefault({ value, onChange }) {
  // BranchSelect's empty option doubles as "School default" here.
  return (
    <BranchSelect
      value={value === SCHOOL ? '' : value}
      onChange={(v) => onChange(v || SCHOOL)}
      allLabel="School default (all branches)"
    />
  );
}
