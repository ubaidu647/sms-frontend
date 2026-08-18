'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import CashBankAccountSelect from '@/component/CashBankAccountSelect';
import { todayYMD, formatMoney } from '@/constants/accounting';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';

// Party sub-ledger kinds we can offer a searchable picker for; everything else
// falls back to a manual party-id field.
const PARTY_TYPES = ['student', 'staff', 'vendor'];

const COPY = {
  payment: {
    title: 'Payment Voucher',
    subtitle:
      'Money out — pick the expense/party account; the cash or bank side is filled automatically.',
    url: '/ledger/voucher/payment',
    accountLabel: 'Paid To (account)',
    submit: 'Post Payment',
    accent: 'bg-red-600',
    accentHover: 'hover:bg-red-700',
  },
  receipt: {
    title: 'Receipt Voucher',
    subtitle:
      'Money in — pick the income/party account; the cash or bank side is filled automatically.',
    url: '/ledger/voucher/receipt',
    accountLabel: 'Received From (account)',
    submit: 'Post Receipt',
    accent: 'bg-green-600',
    accentHover: 'hover:bg-green-700',
  },
};

// kind: 'payment' | 'receipt' | 'contra'
export default function VoucherFormModal({
  isOpen,
  onClose,
  kind = 'payment',
  branchId,
  isOrgLevel,
}) {
  const isContra = kind === 'contra';
  const copy = COPY[kind] || COPY.payment;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [selectedBranch, setSelectedBranch] = useState('');
  const [date, setDate] = useState(todayYMD());
  const [narration, setNarration] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('cash'); // payment/receipt
  const [cashBankAccountId, setCashBankAccountId] = useState(''); // payment/receipt
  const [accountId, setAccountId] = useState(''); // payment/receipt
  const [fromAccountId, setFromAccountId] = useState(''); // contra
  const [toAccountId, setToAccountId] = useState(''); // contra
  const [partyType, setPartyType] = useState('');
  const [partyId, setPartyId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedBranch(isOrgLevel ? branchId || '' : userBranchId);
    setDate(todayYMD());
    setNarration('');
    setAmount('');
    setDescription('');
    setMode('cash');
    setCashBankAccountId('');
    setAccountId('');
    setFromAccountId('');
    setToAccountId('');
    setPartyType('');
    setPartyId('');
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, kind, branchId, isOrgLevel, userBranchId]);

  const effectiveBranch = isOrgLevel ? selectedBranch : userBranchId;

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOpen && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Postable accounts only (level-3 leaves) — the backend rejects group headers.
  const { data: accountData } = useQuery({
    queryKey: ['voucher-accounts', effectiveBranch],
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

  // Contra moves money between cash and bank heads, so it only offers accounts
  // categorised as such. Payments/receipts fill the cash-or-bank side from the
  // mapping, so their counter-account list leaves those heads out.
  // A chart created before categories existed has none — rather than show an
  // empty picker, fall back to the full postable list there.
  const cashBankAccounts = useMemo(
    () => accounts.filter((a) => a.category === 'cash' || a.category === 'bank'),
    [accounts],
  );
  const selectableAccounts = useMemo(() => {
    if (!cashBankAccounts.length) return accounts;
    if (isContra) return cashBankAccounts;
    return accounts.filter((a) => a.category !== 'cash' && a.category !== 'bank');
  }, [accounts, cashBankAccounts, isContra]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a._id === accountId),
    [accounts, accountId],
  );
  const needsParty = !isContra && !!selectedAccount?.isControlAccount;

  // Default the party type from the control account's sub-ledger when known.
  useEffect(() => {
    if (needsParty) setPartyType(selectedAccount?.subLedgerType || '');
    else {
      setPartyType('');
      setPartyId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, needsParty]);

  // Optional searchable party lists for student/staff sub-ledgers.
  const { data: partyListData } = useQuery({
    queryKey: ['voucher-parties', partyType, effectiveBranch],
    queryFn: () => {
      const url = partyType === 'student' ? '/student/list' : '/staff/list';
      return fetchData({
        url,
        page: 1,
        limit: 500,
        token,
        branchId: effectiveBranch || undefined,
      });
    },
    enabled: !!token && needsParty && (partyType === 'student' || partyType === 'staff'),
    staleTime: 30000,
  });
  const parties = partyListData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: copy.url, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || `${copy.title || 'Voucher'} posted`);
      queryClient.invalidateQueries({ queryKey: ['journal-list'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to post voucher';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (isOrgLevel && !effectiveBranch) return 'Select a branch';
    if (!date) return 'Date is required';
    if (!narration?.trim()) return 'Narration is required';
    if (!amount || Number(amount) <= 0) return 'Amount must be greater than zero';
    if (isContra) {
      if (!fromAccountId) return 'Select the account money moves out of';
      if (!toAccountId) return 'Select the account money moves into';
      if (fromAccountId === toAccountId) return 'From and To accounts must differ';
    } else {
      if (!mode) return 'Mode must be cash or bank';
      if (!accountId) return 'Select an account';
      if (needsParty && !partyId)
        return `This is a control account — select the ${partyType || 'party'}`;
    }
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
    const base = {
      date,
      narration: narration.trim(),
      amount: Number(amount),
    };
    if (isOrgLevel && effectiveBranch) base.branchId = effectiveBranch;

    let payload;
    if (isContra) {
      payload = { ...base, fromAccountId, toAccountId };
    } else {
      payload = { ...base, mode, accountId };
      if (cashBankAccountId) payload.cashBankAccountId = cashBankAccountId;
      if (description.trim()) payload.description = description.trim();
      if (needsParty) {
        payload.partyType = partyType;
        payload.partyId = partyId;
      }
    }
    mutation.mutate(payload);
  };

  const accountOptions = (
    <>
      <option value="">Select account…</option>
      {selectableAccounts.map((a) => (
        <option key={a._id} value={a._id}>
          {a.code} · {a.name} ({a.type})
          {a.category === 'cash' || a.category === 'bank' ? ` — ${a.category}` : ''}
          {a.isControlAccount ? ' — control' : ''}
        </option>
      ))}
    </>
  );

  const title = isContra ? 'Contra Voucher' : copy.title;
  const subtitle = isContra
    ? 'Move money between cash and bank — one debit, one credit.'
    : copy.subtitle;
  const accent = isContra ? 'bg-indigo-600' : copy.accent;
  const accentHover = isContra ? 'hover:bg-indigo-700' : copy.accentHover;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="lg"
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
              label={isContra ? 'Post Contra' : copy.submit}
              styleObject={{
                baseColor: accent,
                hoverColor: accentHover,
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isOrgLevel && (
            <div className="sm:col-span-2">
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

          {!isContra && (
            <div>
              <label className={labelCls}>
                Mode<span className="text-red-500">*</span>
              </label>
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
                {['cash', 'bank'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 px-3 py-2 text-sm capitalize ${
                      mode === m
                        ? 'bg-teal-600 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
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
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>

          <div className={isContra ? '' : 'sm:col-span-2'}>
            <label className={labelCls}>
              Narration<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder={isContra ? 'Cash deposited to bank' : 'Electricity bill July'}
              className={inputCls}
            />
          </div>

          {isContra ? (
            <>
              <div>
                <label className={labelCls}>
                  From (money out)<span className="text-red-500">*</span>
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className={inputCls}
                >
                  {accountOptions}
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  To (money in)<span className="text-red-500">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className={inputCls}
                >
                  {accountOptions}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Which cash/bank head the money moves through — only asked when
                  the branch keeps more than one of that kind. */}
              <div className="sm:col-span-2">
                <CashBankAccountSelect
                  method={mode}
                  branchId={effectiveBranch}
                  value={cashBankAccountId}
                  onChange={setCashBankAccountId}
                  labelCls={labelCls}
                  inputCls={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>
                  {copy.accountLabel}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className={inputCls}
                >
                  {accountOptions}
                </select>
              </div>

              {needsParty && (
                <>
                  <div>
                    <label className={labelCls}>
                      Party Type<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={partyType}
                      onChange={(e) => {
                        setPartyType(e.target.value);
                        setPartyId('');
                      }}
                      className={`${inputCls} capitalize`}
                    >
                      <option value="">Select…</option>
                      {PARTY_TYPES.map((p) => (
                        <option key={p} value={p} className="capitalize">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>
                      Party<span className="text-red-500">*</span>
                    </label>
                    {partyType === 'student' || partyType === 'staff' ? (
                      <select
                        value={partyId}
                        onChange={(e) => setPartyId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select {partyType}…</option>
                        {parties.map((p) => {
                          // Name lives under `user`; the identifier differs by kind
                          // (student → admissionNumber, staff → serialNumber). partyId
                          // is the Student/Staff _id, not user._id.
                          const code = partyType === 'student' ? p.admissionNumber : p.serialNumber;
                          return (
                            <option key={p._id} value={p._id}>
                              {p.user?.name || '—'}
                              {code ? ` (${code})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={partyId}
                        onChange={(e) => setPartyId(e.target.value)}
                        placeholder="Party ID"
                        className={inputCls}
                      />
                    )}
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="optional line note"
                  className={inputCls}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
