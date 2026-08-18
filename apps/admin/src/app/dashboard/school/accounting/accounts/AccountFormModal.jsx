'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import {
  ACCOUNT_STATUSES,
  SUB_LEDGER_TYPES,
  ACCOUNT_CATEGORIES,
  ACCOUNT_CATEGORY_LABELS,
  ACCOUNT_CATEGORY_HINTS,
  CATEGORY_ACCOUNT_TYPE,
  ACCOUNT_CODE_REGEX,
  childCodeRange,
} from '@/constants/accounting';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400';
const readOnlyCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';

// Flatten the account tree into a depth-tagged list, keeping only groups —
// levels 1 and 2 are the only legal parents (a level-3 account is postable, and
// the chart stops at 3 levels).
const flattenGroups = (nodes, depth = 0, out = []) => {
  (nodes || []).forEach((n) => {
    if (n.isGroup) {
      out.push({ ...n, depth });
      flattenGroups(n.children, depth + 1, out);
    }
  });
  return out;
};

export default function AccountFormModal({ isOpen, onClose, account, branchId, isOrgLevel }) {
  const isEdit = !!account;
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [codeOverride, setCodeOverride] = useState('');
  const [showCodeOverride, setShowCodeOverride] = useState(false);
  const [category, setCategory] = useState('other');
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
      setName(account.name || '');
      setParentId(account.parentId?._id || account.parentId || '');
      setCategory(account.category || 'other');
      setIsControlAccount(!!account.isControlAccount);
      setSubLedgerType(account.subLedgerType || '');
      setAppliesToAllBranches(account.appliesToAllBranches !== false);
      setBranchIds((account.branchIds || []).map((b) => b?._id || b));
      setDescription(account.description || '');
      setStatus(account.status || 'active');
    } else {
      setName('');
      setParentId('');
      setCategory('other');
      setIsControlAccount(false);
      setSubLedgerType('');
      setAppliesToAllBranches(true);
      setBranchIds([]);
      setDescription('');
      setStatus('active');
    }
    setCodeOverride('');
    setShowCodeOverride(false);
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, isEdit, account]);

  // Parent options come from the tree so we can tell groups from postable
  // accounts and show the hierarchy; only needed while creating.
  const { data: treeData } = useQuery({
    queryKey: ['account-tree', branchId],
    queryFn: () =>
      fetchData({
        url: '/account/tree',
        page: 1,
        limit: 1000,
        token,
        branchId: branchId || undefined,
      }),
    enabled: !!token && isOpen && !isEdit,
    staleTime: 30000,
  });
  const parentOptions = useMemo(() => flattenGroups(treeData?.data), [treeData]);
  const parent = useMemo(
    () => parentOptions.find((p) => p._id === parentId) || null,
    [parentOptions, parentId],
  );

  // Level is derived from the parent: under a root (level 1) you get a level-2
  // group; under a level-2 group you get a level-3 postable account.
  const childLevel = parent ? parent.level + 1 : null;
  const childIsGroup = childLevel === 2;
  const canBeControl = isEdit ? account?.level === 3 : childLevel === 3;
  const codeRange = parent ? childCodeRange(parent) : null;

  // Only a postable asset account can be a cash or bank head — that's the flag
  // the ledger's cash/bank mapping reads, so it's picked at creation time.
  const accountType = isEdit ? account?.type : parent?.type;
  const canSetCategory = canBeControl && accountType === CATEGORY_ACCOUNT_TYPE;

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
    if (!name?.trim()) return 'Account name is required';
    if (!isEdit && !parentId) return 'Parent account is required';
    if (!isEdit && showCodeOverride && codeOverride.trim()) {
      const c = codeOverride.trim();
      if (!ACCOUNT_CODE_REGEX.test(c)) return 'Code must be exactly 4 digits';
      const num = Number(c);
      if (codeRange && (num < codeRange.from || num > codeRange.to))
        return `Code ${c} is outside parent ${parent.code}'s range (${codeRange.from}–${codeRange.to})`;
      if (codeRange?.step === 100 && num % 100 !== 0)
        return `Code ${c} must be a multiple of 100 from parent ${parent.code}`;
    }
    if (isControlAccount && !canBeControl)
      return 'Only a level-3 (postable) account can be a control account';
    if (isControlAccount && !subLedgerType) return 'Control accounts need a sub-ledger type';
    if (category !== 'other' && !canSetCategory)
      return 'Only a postable account under Assets can be a cash or bank account';
    if (category !== 'other' && isControlAccount)
      return 'A cash or bank account cannot also be a party control account';
    if (isOrgLevel && !appliesToAllBranches && !branchIds.length)
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
      name: name.trim(),
      description: description.trim() || undefined,
    };
    // Control flags only exist on postable (level-3) accounts — send them only
    // where they're legal, and drop subLedgerType entirely when not a control.
    if (canBeControl) payload.isControlAccount = isControlAccount;
    if (isControlAccount) payload.subLedgerType = subLedgerType;
    // Send the category wherever it's legal, including 'other' — that's how an
    // account previously tagged cash/bank gets cleared again on edit.
    if (canSetCategory) payload.category = category;

    // Branch-tier users don't get a scope choice — the server pins the account
    // to their own branch whatever we send, so we send nothing.
    if (isOrgLevel) {
      payload.appliesToAllBranches = appliesToAllBranches;
      if (!appliesToAllBranches) payload.branchIds = branchIds;
    }

    if (isEdit) {
      payload.status = status;
    } else {
      // code/level/isGroup are all derived server-side; type must match the parent.
      payload.parentId = parentId;
      payload.type = parent?.type;
      payload.status = status;
      if (showCodeOverride && codeOverride.trim()) payload.code = codeOverride.trim();
    }

    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Account' : 'New Account'}
      subtitle={
        isEdit
          ? 'Code, type and parent are fixed once an account exists — rename, re-scope or retire it here.'
          : 'Pick a parent group; the code, level and type are derived from it.'
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

        {isEdit ? (
          /* Fixed identity — shown for context, never editable. */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg">
            <div>
              <span className={labelCls}>Code</span>
              <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                {account?.code}
              </div>
            </div>
            <div>
              <span className={labelCls}>Type</span>
              <div className="text-sm capitalize text-gray-900 dark:text-gray-100">
                {account?.type}
              </div>
            </div>
            <div>
              <span className={labelCls}>Level</span>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {account?.level}
                <span className="text-xs text-gray-500 ml-1">
                  {account?.isGroup ? '(group)' : '(postable)'}
                </span>
              </div>
            </div>
            <div>
              <span className={labelCls}>Parent</span>
              <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                {account?.parentId?.name
                  ? `${account.parentId.code} · ${account.parentId.name}`
                  : account?.parent?.name
                    ? `${account.parent.code} · ${account.parent.name}`
                    : '—'}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Parent Account<span className="text-red-500">*</span>
              </label>
              <select
                value={parentId}
                onChange={(e) => {
                  setParentId(e.target.value);
                  setCodeOverride('');
                  setCategory('other');
                  setIsControlAccount(false);
                  setSubLedgerType('');
                }}
                className={inputCls}
              >
                <option value="">— Select a group account —</option>
                {parentOptions.map((a) => (
                  <option key={a._id} value={a._id}>
                    {'  '.repeat(a.depth)}
                    {a.code} · {a.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {parent
                  ? `Creates a level-${childLevel} ${
                      childIsGroup ? 'group (holds other accounts)' : 'postable account'
                    } · type ${parent.type} · code ${codeRange?.from}–${codeRange?.to}`
                  : 'Only group accounts (levels 1–2) can hold children. The 5 roots are seeded and cannot be recreated.'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cash in Hand — Main Branch"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Type</label>
              <input
                type="text"
                value={parent?.type || ''}
                readOnly
                placeholder="From parent"
                className={`${readOnlyCls} capitalize`}
              />
            </div>
            <div>
              <label className={labelCls}>Code</label>
              {showCodeOverride ? (
                <input
                  type="text"
                  value={codeOverride}
                  onChange={(e) => setCodeOverride(e.target.value)}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder={codeRange ? String(codeRange.from) : '1104'}
                  className={`${inputCls} font-mono`}
                />
              ) : (
                <input
                  type="text"
                  value="Auto-generated"
                  readOnly
                  className={readOnlyCls}
                  onClick={() => setShowCodeOverride(true)}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setShowCodeOverride((v) => !v);
                  setCodeOverride('');
                }}
                className="text-xs text-teal-700 dark:text-teal-400 hover:underline mt-1"
              >
                {showCodeOverride ? 'Use the next available code' : 'Set the code manually'}
              </button>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Petty cash float held at the branch office"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {isEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={inputCls}
              />
            </div>
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
          </div>
        )}

        {/* Money category — what makes an account mappable as cash or bank. */}
        {canSetCategory && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <label className={labelCls}>Category</label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    if (c !== 'other') {
                      setIsControlAccount(false);
                      setSubLedgerType('');
                    }
                  }}
                  className={`px-3 py-2 rounded-lg border text-sm text-left ${
                    category === c
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="font-medium block">{ACCOUNT_CATEGORY_LABELS[c]}</span>
                  <span className="text-xs text-gray-500 leading-tight block mt-0.5">
                    {ACCOUNT_CATEGORY_HINTS[c]}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Fee collection, salary payments and vouchers post the money side to this branch’s Cash
              or Bank account. Create one per branch — and one per bank you hold; the collector
              picks which when there is more than one.
            </p>
          </div>
        )}

        {/* Control-account flags — postable (level 3) accounts only. */}
        {canBeControl && category === 'other' && (
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
        )}

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          {isOrgLevel ? (
            <>
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
                  <label className={labelCls}>
                    Branches<span className="text-red-500">*</span>
                  </label>
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
                  <p className="text-xs text-gray-500 mt-1">
                    A child account can only cover branches its parent covers.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500">
              This account is scoped to your branch. Per-branch accounts — cash in hand, for
              instance — belong to one branch only.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
