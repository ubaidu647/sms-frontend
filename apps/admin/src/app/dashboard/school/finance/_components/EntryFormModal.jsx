'use client';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import {
  holdKey,
  idempotencyHeader,
  isUnknownOutcome,
  keyForTarget,
  newIdempotencyKey,
  releaseKey,
  spentKeyMessage,
  successMessage,
} from '@/utils/idempotency';
import { todayYMD, toYMD, formatMoney, hasAtMostTwoDecimals } from '@/constants/accounting';
import {
  KIND_COPY,
  inputCls,
  labelCls,
  cancelButtonStyle,
  primaryButtonStyle,
  invalidateFinanceQueries,
  useBranches,
  useCategories,
  useFinanceAccess,
  useMoneyAccounts,
} from './financeShared';
import CategoryFormModal from './CategoryFormModal';

const moneyLabel = (a) =>
  `${a.name} — ${a.category === 'cash' ? 'Cash' : 'Bank'} (${formatMoney(a.balance)})`;

/**
 * Record (or edit) an expense, an other-income receipt or a transfer.
 * `entry` set → edit mode: the server reverses the old booking and posts a new one.
 */
export default function EntryFormModal({ isOpen, onClose, kind = 'expense', entry, branchId }) {
  const isEdit = !!entry;
  const isTransfer = kind === 'transfer';
  const copy = KIND_COPY[kind] || KIND_COPY.expense;
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const { isOrgLevel, userBranchId } = useFinanceAccess();

  const [selectedBranch, setSelectedBranch] = useState('');
  const [date, setDate] = useState(todayYMD());
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [cashBankAccountId, setCashBankAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [party, setParty] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);

  const keyTarget = `finance-entry:${kind}`;
  const idempotencyKeyRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    idempotencyKeyRef.current = keyForTarget(keyTarget);
    setError('');
    setReceipt(null);
    if (entry) {
      setSelectedBranch(String(entry.branchId?._id || entry.branchId || ''));
      setDate(toYMD(entry.date));
      setAmount(String(entry.amount));
      setAccountId(String(entry.accountId || ''));
      setCashBankAccountId(String(entry.cashBankAccountId || ''));
      setToAccountId(String(entry.toAccountId || ''));
      setParty(entry.party || '');
      setNote(entry.note || '');
    } else {
      setSelectedBranch(isOrgLevel ? branchId || userBranchId || '' : userBranchId);
      setDate(todayYMD());
      setAmount('');
      setAccountId('');
      setCashBankAccountId('');
      setToAccountId('');
      setParty('');
      setNote('');
    }
  }, [isOpen, entry, keyTarget, branchId, isOrgLevel, userBranchId]);

  const effectiveBranch = isEdit ? selectedBranch : isOrgLevel ? selectedBranch : userBranchId;

  const branches = useBranches(isOpen && isOrgLevel && !isEdit);
  const categories = useCategories(kind, effectiveBranch, isOpen && !isTransfer);
  const { accounts: moneyAccounts } = useMoneyAccounts(
    effectiveBranch,
    isOpen && !!effectiveBranch,
  );

  // A single cash box is the usual case — pick it so the form is one field shorter.
  useEffect(() => {
    if (!isOpen || isEdit || cashBankAccountId || !moneyAccounts.length) return;
    const cash = moneyAccounts.filter((a) => a.category === 'cash');
    if (cash.length === 1) setCashBankAccountId(String(cash[0]._id));
  }, [isOpen, isEdit, cashBankAccountId, moneyAccounts]);

  const uploadReceipt = async (id) => {
    if (!receipt) return;
    const form = new FormData();
    form.append('receipt', receipt);
    try {
      await postData({ url: `/finance/entries/${id}/receipt`, payload: form, token });
    } catch (err) {
      // The money is recorded either way; only the photo is missing.
      toast.error(`Saved, but the receipt photo was not uploaded: ${err.message}`);
    }
  };

  const mutation = useMutation({
    mutationFn: async ({ idempotencyKey, ...payload }) => {
      const res = isEdit
        ? await putData({ url: `/finance/entries/${entry._id}`, payload, token })
        : await postData({
            url: '/finance/entries',
            payload,
            token,
            headers: idempotencyHeader(idempotencyKey),
          });
      const id = res?.data?._id || entry?._id;
      if (id) await uploadReceipt(id);
      return res;
    },
    onSuccess: (res) => {
      releaseKey(keyTarget);
      idempotencyKeyRef.current = newIdempotencyKey();
      toast.success(successMessage(res, isEdit ? 'Entry updated' : `${copy.singular} recorded`));
      invalidateFinanceQueries(queryClient);
      onClose();
    },
    onError: (err) => {
      const spent = spentKeyMessage(err);
      if (spent) {
        releaseKey(keyTarget);
        idempotencyKeyRef.current = newIdempotencyKey();
        invalidateFinanceQueries(queryClient);
        setError(spent);
        toast.error(spent);
        return;
      }
      const msg = err.message || 'Could not save';
      setError(msg);
      toast.error(msg);
      if (!isEdit && isUnknownOutcome(err)) {
        holdKey(keyTarget, idempotencyKeyRef.current);
        invalidateFinanceQueries(queryClient);
      }
    },
  });

  const validate = () => {
    if (!effectiveBranch) return 'Select a branch';
    if (!date) return 'Date is required';
    if (!amount || Number(amount) <= 0) return 'Amount must be greater than zero';
    if (!hasAtMostTwoDecimals(amount)) return 'Amount can have at most 2 decimal places';
    if (!isTransfer && !accountId) return 'Select a category';
    if (!cashBankAccountId)
      return `Select the account money is ${kind === 'income' ? 'received into' : 'paid from'}`;
    if (isTransfer) {
      if (!toAccountId) return 'Select the account the money goes to';
      if (toAccountId === cashBankAccountId) return 'From and To accounts must be different';
    }
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const problem = validate();
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }
    const payload = {
      date,
      amount: Number(amount),
      cashBankAccountId,
      note: note.trim(),
    };
    if (!isTransfer) {
      payload.accountId = accountId;
      payload.party = party.trim();
    } else {
      payload.toAccountId = toAccountId;
    }
    if (!isEdit) {
      payload.kind = kind;
      payload.branchId = effectiveBranch;
      // The create endpoint takes optional text only when there is some.
      if (!payload.note) delete payload.note;
      if (!payload.party) delete payload.party;
    }
    mutation.mutate({ ...payload, idempotencyKey: idempotencyKeyRef.current });
  };

  const closeIfIdle = () => {
    if (!mutation.isPending) onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={closeIfIdle}
        title={isEdit ? `Edit ${entry.serialNumber}` : `New ${copy.singular}`}
        subtitle={copy.subtitle}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <div className="text-sm text-gray-500">
              Amount{' '}
              <strong className="text-gray-800 dark:text-gray-200">
                {formatMoney(Number(amount) || 0)}
              </strong>
            </div>
            <div className="flex gap-3">
              <Button
                label="Cancel"
                handleClick={closeIfIdle}
                type="button"
                styleObject={cancelButtonStyle}
              />
              <Button
                label={isEdit ? 'Save changes' : 'Save'}
                handleClick={handleSubmit}
                loading={mutation.isPending}
                type="button"
                styleObject={primaryButtonStyle(copy.accent, copy.accentHover)}
              />
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {isEdit && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Saving keeps a full history: the old entry is reversed in the books and the corrected
              one is posted.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isOrgLevel && !isEdit && (
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Branch<span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setCashBankAccountId('');
                    setToAccountId('');
                  }}
                  className={inputCls}
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

            <div>
              <label className={labelCls}>
                Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Amount<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>

            {!isTransfer && (
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Category<span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCategoryOpen(true)}
                    title="Add a category"
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-teal-600 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </button>
                </div>
              </div>
            )}

            <div className={isTransfer ? '' : 'sm:col-span-2'}>
              <label className={labelCls}>
                {copy.moneyLabel}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={cashBankAccountId}
                onChange={(e) => setCashBankAccountId(e.target.value)}
                className={inputCls}
                disabled={!effectiveBranch}
              >
                <option value="">
                  {effectiveBranch ? 'Select account…' : 'Select a branch first'}
                </option>
                {moneyAccounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {moneyLabel(a)}
                  </option>
                ))}
              </select>
            </div>

            {isTransfer && (
              <div>
                <label className={labelCls}>
                  To<span className="text-red-500">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className={inputCls}
                  disabled={!effectiveBranch}
                >
                  <option value="">Select account…</option>
                  {moneyAccounts
                    .filter((a) => String(a._id) !== cashBankAccountId)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {moneyLabel(a)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {!isTransfer && (
              <div className="sm:col-span-2">
                <label className={labelCls}>{copy.partyLabel}</label>
                <input
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  placeholder={copy.partyPlaceholder}
                  maxLength={100}
                  className={inputCls}
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className={labelCls}>Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Optional"
                className={inputCls}
              />
            </div>

            {!isTransfer && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Receipt photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950/40 dark:file:text-teal-300"
                />
                {isEdit && entry.receipt?.url && !receipt && (
                  <a
                    href={entry.receipt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-700 dark:text-teal-400 underline mt-1 inline-block"
                  >
                    View current receipt
                  </a>
                )}
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP or PDF, up to 5 MB.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {!isTransfer && (
        <CategoryFormModal
          isOpen={categoryOpen}
          onClose={() => setCategoryOpen(false)}
          type={kind}
          onCreated={(cat) => setAccountId(String(cat._id))}
        />
      )}
    </>
  );
}
