'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { ACCOUNT_TYPES, ACCOUNT_STATUSES, SUB_LEDGER_TYPES } from '@/constants/accounting';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';

export default function AccountFormModal({ isOpen, onClose, account, branchId, isOrgLevel }) {
  const isEdit = !!account;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [parentId, setParentId] = useState('');
  const [isControlAccount, setIsControlAccount] = useState(false);
  const [subLedgerType, setSubLedgerType] = useState('');
  const [appliesToAllBranches, setAppliesToAllBranches] = useState(true);
  const [branchIds, setBranchIds] = useState([]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setCode(account.code || '');
      setName(account.name || '');
      setType(account.type || 'expense');
      setParentId(account.parentId?._id || account.parentId || '');
      setIsControlAccount(!!account.isControlAccount);
      setSubLedgerType(account.subLedgerType || '');
      setAppliesToAllBranches(account.appliesToAllBranches !== false);
      setBranchIds(account.branchIds || []);
      setDescription(account.description || '');
      setStatus(account.status || 'active');
    } else {
      setCode('');
      setName('');
      setType('expense');
      setParentId('');
      setIsControlAccount(false);
      setSubLedgerType('');
      setAppliesToAllBranches(true);
      setBranchIds(!isOrgLevel && userBranchId ? [userBranchId] : []);
      setDescription('');
      setStatus('active');
    }
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, isEdit, account, isOrgLevel, userBranchId]);

  // Parent options — flat account list scoped to the same branch context as the page.
  const { data: parentData } = useQuery({
    queryKey: ['account-parents', branchId],
    queryFn: () =>
      fetchData({
        url: '/account/list',
        page: 1,
        limit: 1000,
        token,
        branchId: branchId || undefined,
      }),
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const parentOptions = useMemo(
    () => (parentData?.data || []).filter((a) => !isEdit || a._id !== account?._id),
    [parentData, isEdit, account],
  );

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOpen && isOrgLevel && !appliesToAllBranches,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const toggleBranch = (id) =>
    setBranchIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? putData({ url: `/account/${account._id}`, payload, token })
        : postData({ url: '/account', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isEdit ? 'Account updated' : 'Account created'));
      queryClient.invalidateQueries({ queryKey: ['account-tree'] });
      queryClient.invalidateQueries({ queryKey: ['account-list'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save account';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (!code?.trim()) return 'Account code is required';
    if (!name?.trim()) return 'Account name is required';
    if (!ACCOUNT_TYPES.includes(type)) return 'Invalid account type';
    if (isControlAccount && !subLedgerType) return 'Control accounts need a sub-ledger type';
    if (!appliesToAllBranches && !branchIds.length)
      return 'Select at least one branch, or mark it as applying to all branches';
    return null;
  };

  const handleSubmit = () => {
    setSubmitError('');
    const err = validate();
    if (err) {
      setSubmitError(err);
      toast.error(err);
      return;
    }
    const payload = {
      code: code.trim(),
      name: name.trim(),
      type,
      appliesToAllBranches,
      branchIds: appliesToAllBranches ? [] : branchIds,
      isControlAccount,
      description: description.trim() || undefined,
      status,
    };
    if (parentId) payload.parentId = parentId;
    if (isControlAccount && subLedgerType) payload.subLedgerType = subLedgerType;
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Account' : 'New Account'}
      subtitle={
        isEdit
          ? 'Update this ledger account. Code and type are best kept stable once posted to.'
          : 'Add a ledger account under the chart of accounts hierarchy.'
      }
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label={isEdit ? 'Save Changes' : 'Create Account'}
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={mutation.isPending}
            success={successState}
            handleClick={handleSubmit}
          />
        </div>
      }
    >
      <div className="space-y-5">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Code<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="5104"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              Type<span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`${inputCls} capitalize`}
            >
              {ACCOUNT_TYPES.map((tp) => (
                <option key={tp} value={tp} className="capitalize">
                  {tp}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Internet Charges"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Parent Account</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={inputCls}
            >
              <option value="">— None (top level) —</option>
              {parentOptions.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.code} · {a.name}
                  {a.type ? ` (${a.type})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Monthly ISP bill"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isControlAccount}
              onChange={(e) => {
                setIsControlAccount(e.target.checked);
                if (!e.target.checked) setSubLedgerType('');
              }}
            />
            Control account (tracks a party sub-ledger)
          </label>
          {isControlAccount && (
            <select
              value={subLedgerType}
              onChange={(e) => setSubLedgerType(e.target.value)}
              className={`${inputCls} w-auto capitalize`}
            >
              <option value="">Sub-ledger type…</option>
              {SUB_LEDGER_TYPES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={appliesToAllBranches}
              onChange={(e) => setAppliesToAllBranches(e.target.checked)}
            />
            Applies to all branches
          </label>

          {!appliesToAllBranches && (
            <div className="mt-3">
              <label className={labelCls}>Branches</label>
              {isOrgLevel ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {branches.length ? (
                    branches.map((b) => (
                      <label
                        key={b._id}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={branchIds.includes(b._id)}
                          onChange={() => toggleBranch(b._id)}
                        />
                        {b.name}
                      </label>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Loading branches…</span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">This account will be scoped to your branch.</p>
              )}
            </div>
          )}
        </div>

        {isEdit && (
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${inputCls} capitalize`}
            >
              {ACCOUNT_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}
