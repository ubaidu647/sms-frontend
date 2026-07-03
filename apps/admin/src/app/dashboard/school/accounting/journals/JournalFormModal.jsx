'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { todayYMD, sumLines, formatMoney } from '@/constants/accounting';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';

const blankLine = () => ({ accountId: '', debit: '', credit: '', description: '' });

// mode: 'manual' → POST /ledger/journal ; 'opening-balance' → POST /ledger/opening-balance.
// Both share the { branchId, date, narration, lines[] } contract.
export default function JournalFormModal({
  isOpen,
  onClose,
  mode = 'manual',
  branchId,
  isOrgLevel,
}) {
  const isOpening = mode === 'opening-balance';
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [selectedBranch, setSelectedBranch] = useState('');
  const [date, setDate] = useState(todayYMD());
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState([blankLine(), blankLine()]);
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedBranch(isOrgLevel ? branchId || '' : userBranchId);
    setDate(todayYMD());
    setNarration('');
    setLines([blankLine(), blankLine()]);
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, mode, branchId, isOrgLevel, userBranchId]);

  const effectiveBranch = isOrgLevel ? selectedBranch : userBranchId;

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOpen && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Postable accounts — exclude group headers, which can't take direct entries.
  const { data: accountData } = useQuery({
    queryKey: ['journal-accounts', effectiveBranch],
    queryFn: () =>
      fetchData({
        url: '/account/list',
        page: 1,
        limit: 1000,
        token,
        branchId: effectiveBranch || undefined,
      }),
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const accounts = useMemo(
    () => (accountData?.data || []).filter((a) => !a.isGroup),
    [accountData],
  );

  const totals = useMemo(() => sumLines(lines), [lines]);
  const balanced = totals.debit > 0 && totals.debit === totals.credit;

  const updateLine = (i, patch) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, blankLine()]);
  const removeLine = (i) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const mutation = useMutation({
    mutationFn: (payload) =>
      postData({
        url: isOpening ? '/ledger/opening-balance' : '/ledger/journal',
        payload,
        token,
      }),
    onSuccess: (res) => {
      toast.success(
        res?.message || (isOpening ? 'Opening balance posted' : 'Journal entry posted'),
      );
      queryClient.invalidateQueries({ queryKey: ['journal-list'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to post entry';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (isOrgLevel && !effectiveBranch) return 'Select a branch';
    if (!date) return 'Date is required';
    if (!narration?.trim()) return 'Narration is required';
    const clean = lines.filter((l) => l.accountId && (Number(l.debit) || Number(l.credit)));
    if (clean.length < 2) return 'Add at least two lines with an account and an amount';
    for (let i = 0; i < clean.length; i++) {
      const l = clean[i];
      const d = Number(l.debit) || 0;
      const c = Number(l.credit) || 0;
      if (d && c) return `Line ${i + 1}: a line can't have both a debit and a credit`;
      if (!d && !c) return `Line ${i + 1}: enter a debit or a credit`;
    }
    if (!balanced) return 'Entry is unbalanced — total debit must equal total credit';
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
      branchId: effectiveBranch || undefined,
      date,
      narration: narration.trim(),
      lines: lines
        .filter((l) => l.accountId && (Number(l.debit) || Number(l.credit)))
        .map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          ...(l.description?.trim() ? { description: l.description.trim() } : {}),
        })),
    };
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isOpening ? 'Opening Balance' : 'New Journal Entry'}
      subtitle={
        isOpening
          ? 'Post opening balances against the opening-balance equity account.'
          : 'Record a balanced manual journal entry (debits must equal credits).'
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-sm">
            <span className="text-gray-500 mr-3">
              Dr{' '}
              <strong className="text-gray-800 dark:text-gray-200">
                {formatMoney(totals.debit)}
              </strong>
            </span>
            <span className="text-gray-500 mr-3">
              Cr{' '}
              <strong className="text-gray-800 dark:text-gray-200">
                {formatMoney(totals.credit)}
              </strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                balanced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {balanced ? 'Balanced' : 'Unbalanced'}
            </span>
          </div>
          <div className="flex gap-3">
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
              label={isOpening ? 'Post Opening Balance' : 'Post Entry'}
              styleObject={{
                baseColor: 'bg-teal-600',
                hoverColor: 'hover:bg-teal-700',
                rounded: 'rounded-full',
                size: 'px-8 py-3 text-md min-h-[3rem]',
                textColor: 'text-white',
              }}
              loading={mutation.isPending}
              success={successState}
              handleClick={handleSubmit}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isOrgLevel && (
            <div>
              <label className={labelCls}>
                Branch<span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
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
          <div className={isOrgLevel ? '' : 'sm:col-span-2'}>
            <label className={labelCls}>
              Narration<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder={isOpening ? 'Opening balances FY26' : 'Petty cash for stationery'}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            Lines
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Account</th>
                  <th className="px-3 py-2 text-left font-semibold w-32">Debit</th>
                  <th className="px-3 py-2 text-left font-semibold w-32">Credit</th>
                  <th className="px-3 py-2 text-left font-semibold">Description</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 min-w-[180px]">
                      <select
                        value={l.accountId}
                        onChange={(e) => updateLine(i, { accountId: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">Select account…</option>
                        {accounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.code} · {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={l.debit}
                        onChange={(e) => updateLine(i, { debit: e.target.value, credit: '' })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={l.credit}
                        onChange={(e) => updateLine(i, { credit: e.target.value, debit: '' })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2 min-w-[140px]">
                      <input
                        type="text"
                        value={l.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        placeholder="optional"
                        className={inputCls}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        disabled={lines.length <= 2}
                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg border border-teal-200"
          >
            <Plus className="w-4 h-4" />
            Add Line
          </button>
        </div>
      </div>
    </Modal>
  );
}
