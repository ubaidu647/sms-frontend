'use client';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { todayYMD, hasAtMostTwoDecimals } from '@/constants/accounting';
import {
  inputCls,
  labelCls,
  cancelButtonStyle,
  primaryButtonStyle,
  invalidateFinanceQueries,
  useBranches,
  useFinanceAccess,
} from '../_components/financeShared';

/** Open a cash box or a bank account, with what it already holds today. */
export default function MoneyAccountFormModal({ isOpen, onClose, branchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const { isOrgLevel, userBranchId } = useFinanceAccess();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('bank');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [allBranches, setAllBranches] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingDate, setOpeningDate] = useState(todayYMD());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setCategory('bank');
    setSelectedBranch(isOrgLevel ? branchId || userBranchId || '' : userBranchId);
    setAllBranches(false);
    setOpeningBalance('');
    setOpeningDate(todayYMD());
    setError('');
  }, [isOpen, branchId, isOrgLevel, userBranchId]);

  const branches = useBranches(isOpen && isOrgLevel);
  const shared = category === 'bank' && allBranches;

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/finance/cash-bank-accounts', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Account created');
      invalidateFinanceQueries(queryClient);
      onClose();
    },
    onError: (err) => {
      const msg = err.message || 'Could not create the account';
      setError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    setError('');
    const opening = openingBalance === '' ? 0 : Number(openingBalance);
    let problem = null;
    if (!name.trim()) problem = 'Name is required';
    else if (!shared && !selectedBranch) problem = 'Select the branch this account belongs to';
    else if (shared && opening > 0 && !selectedBranch)
      problem = 'Select the branch whose books carry the opening balance';
    else if (opening < 0) problem = 'Opening balance cannot be negative';
    else if (opening > 0 && !hasAtMostTwoDecimals(openingBalance))
      problem = 'Amount can have at most 2 decimal places';
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }

    const payload = { name: name.trim(), category };
    if (shared) payload.allBranches = true;
    if (selectedBranch) payload.branchId = selectedBranch;
    if (opening > 0) {
      payload.openingBalance = opening;
      payload.openingDate = openingDate;
    }
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !mutation.isPending && onClose()}
      title="New cash or bank account"
      subtitle="Every fee, salary and expense shows which account the money went through."
      size="md"
      footer={
        <div className="flex gap-3 w-full justify-end">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={cancelButtonStyle}
          />
          <Button
            label="Create"
            handleClick={handleSubmit}
            loading={mutation.isPending}
            type="button"
            styleObject={primaryButtonStyle()}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className={labelCls}>Type</label>
          <div className="flex gap-2">
            {[
              { value: 'bank', label: 'Bank account' },
              { value: 'cash', label: 'Cash box' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCategory(opt.value);
                  if (opt.value === 'cash') setAllBranches(false);
                }}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  category === opt.value
                    ? 'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>
            Name<span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={category === 'bank' ? 'Meezan Bank — 0123' : 'Petty cash'}
            maxLength={100}
            className={inputCls}
          />
        </div>

        {isOrgLevel && category === 'bank' && (
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={allBranches}
              onChange={(e) => setAllBranches(e.target.checked)}
            />
            Every branch banks through this account
          </label>
        )}

        {isOrgLevel && (
          <div>
            <label className={labelCls}>
              {shared ? 'Branch for the opening balance' : 'Branch'}
              {!shared && <span className="text-red-500">*</span>}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Money in it today</label>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>As of</label>
            <input
              type="date"
              value={openingDate}
              onChange={(e) => setOpeningDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Leave the amount empty for a new, empty account. It is booked as the opening balance.
        </p>
      </div>
    </Modal>
  );
}
