'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Save, Zap, ZapOff, Info } from 'lucide-react';
import Link from 'next/link';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, putData } from '@/utils/api';
import toast from 'react-hot-toast';
import { MAPPING_ROLES } from '@/constants/accounting';

const inputWrap =
  'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none';

export default function MappingPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canUpdate =
    isAdmin ||
    actions.includes('update-account-mapping') ||
    actions.includes('update-all-branch-account-mapping');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-account-mapping');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  // Org users can edit the org-wide default (empty) or a per-branch override.
  const [scopeBranch, setScopeBranch] = useState('');
  const effectiveBranchId = isOrgLevel ? scopeBranch : userBranchId;

  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [roleMap, setRoleMap] = useState({}); // { role: accountId }
  const [dirty, setDirty] = useState(false);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: accountData } = useQuery({
    queryKey: ['mapping-accounts', effectiveBranchId],
    queryFn: () =>
      fetchData({
        url: '/account/list',
        page: 1,
        limit: 1000,
        token,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token,
    staleTime: 30000,
  });
  const accounts = useMemo(
    () => (accountData?.data || []).filter((a) => !a.isGroup),
    [accountData],
  );

  const { data: mappingData, isFetching } = useQuery({
    queryKey: ['account-mapping', effectiveBranchId],
    queryFn: () => fetchData({ url: '/ledger/mapping', token }),
    enabled: !!token && !!user,
  });

  // The endpoint returns every mapping doc (org default + branch overrides). Pick
  // the one matching the current scope: branchId null for org default, else exact.
  const current = useMemo(() => {
    const list = mappingData?.data || [];
    const wanted = effectiveBranchId || null;
    return (
      list.find((m) => (m.branchId?._id || m.branchId || null) === wanted) ||
      list.find((m) => !m.branchId) ||
      null
    );
  }, [mappingData, effectiveBranchId]);

  useEffect(() => {
    const map = {};
    (current?.mappings || []).forEach((m) => {
      map[m.role] = m.accountId?._id || m.accountId || '';
    });
    setRoleMap(map);
    setAutoPostEnabled(!!current?.autoPostEnabled);
    setDirty(false);
  }, [current, effectiveBranchId]);

  const setRole = (role, accountId) => {
    setRoleMap((prev) => ({ ...prev, [role]: accountId }));
    setDirty(true);
  };

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: '/ledger/mapping', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Account mapping saved');
      queryClient.invalidateQueries({ queryKey: ['account-mapping'] });
      setDirty(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to save mapping'),
  });

  const handleSave = () => {
    const mappings = MAPPING_ROLES.filter((r) => roleMap[r.role]).map((r) => ({
      role: r.role,
      accountId: roleMap[r.role],
    }));
    mutation.mutate({
      branchId: effectiveBranchId || null,
      autoPostEnabled,
      mappings,
    });
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Account Mapping
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Wire fee and salary transactions to ledger accounts for automatic posting.
            </p>
          </div>
          {isOrgLevel && (
            <select
              value={scopeBranch}
              onChange={(e) => setScopeBranch(e.target.value)}
              className={inputWrap}
            >
              <option value="">Organisation default</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} (override)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Auto-post toggle */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-5">
          <div className="flex items-center gap-3">
            {autoPostEnabled ? (
              <Zap className="w-5 h-5 text-teal-600" />
            ) : (
              <ZapOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Auto-posting</div>
              <div className="text-xs text-gray-500">
                When on, fee/salary payments post ledger entries automatically.
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={!canUpdate}
            onClick={() => {
              setAutoPostEnabled((v) => !v);
              setDirty(true);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              autoPostEnabled ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoPostEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Cash and bank are not mapped here — they are per-branch and a branch
            can hold several, so they are picked on the transaction instead. */}
        <div className="flex gap-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 rounded-xl p-4 mb-5">
          <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-sky-900 dark:text-sky-200">
            <div className="font-semibold">Cash and bank are not configured here</div>
            <p className="text-sky-800 dark:text-sky-300 mt-0.5">
              Cash is held per branch and a branch can bank with more than one institution, so there
              is no single school-wide answer. Create those accounts in the{' '}
              <Link
                href="/dashboard/school/accounting/accounts"
                className="underline font-medium hover:text-sky-950 dark:hover:text-sky-100"
              >
                Chart of Accounts
              </Link>{' '}
              with the category <strong>Cash</strong> or <strong>Bank</strong>. Fee collection,
              salary payments and vouchers then use that branch’s account — and ask which one when
              the branch keeps several.
            </p>
          </div>
        </div>

        {/* Role → account */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {isFetching && !current ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading mapping…</div>
          ) : (
            MAPPING_ROLES.map((r) => (
              <div key={r.role} className="flex flex-col sm:flex-row sm:items-center gap-2 p-4">
                <div className="sm:w-56 flex-shrink-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{r.label}</div>
                  <div className="text-xs text-gray-500">{r.hint}</div>
                </div>
                <select
                  value={roleMap[r.role] || ''}
                  disabled={!canUpdate}
                  onChange={(e) => setRole(r.role, e.target.value)}
                  className={`${inputWrap} flex-1 disabled:opacity-60`}
                >
                  <option value="">— Not mapped —</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.code} · {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>

        {canUpdate && (
          <div className="flex justify-end mt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || mutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : 'Save Mapping'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
