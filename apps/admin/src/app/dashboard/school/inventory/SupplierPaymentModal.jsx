'use client';
// Record a payment to a supplier (≤ the supplier's balance):
// POST /inventory/supplier-payments { supplierId, branchId?, date, amount, method, ledgerAccountId?, reference? }.
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import CashBankAccountSelect from '@/component/CashBankAccountSelect';
import { postData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
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
import { useTokenStore } from '@/store/tokenStore';
import { fromPaisa, toPaisa, validateSupplierPayment } from '@/utils/inventory';
import { BranchSelect } from '../leave/LeavePickers';
import {
  ModalFooter,
  errorCls,
  inputCls,
  invalidateInventoryPurchases,
  labelCls,
  money,
} from './inventoryShared';
import { useSchoolCurrency } from '@/hooks/useSchoolCurrency';

export default function SupplierPaymentModal({ supplier, onClose, orgTier, defaultBranchId }) {
  const { symbol: currencySymbol } = useSchoolCurrency();
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const isOpen = !!supplier;
  const balance = Number(supplier?.balance) || 0;
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(localYMD());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [ledgerAccountId, setAccount] = useState('');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState({});
  // One key per payment attempt, held per supplier when the response was lost so
  // a resubmit after reopening replays instead of paying the supplier twice.
  const keyTarget = `inventory-supplier-payment:${supplier?._id}`;
  const keyRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setBranchId(defaultBranchId || '');
      setDate(localYMD());
      setAmount(balance > 0 ? String(fromPaisa(toPaisa(balance))) : '');
      setMethod('cash');
      setAccount('');
      setReference('');
      setErrors({});
      keyRef.current = keyForTarget(keyTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplier?._id, defaultBranchId]);

  const mutation = useMutation({
    mutationFn: ({ idempotencyKey, ...payload }) =>
      postData({
        url: '/inventory/supplier-payments',
        payload,
        token,
        headers: idempotencyHeader(idempotencyKey),
      }),
    onSuccess: (res) => {
      // This payment is recorded; the next one must not replay it.
      releaseKey(keyTarget);
      keyRef.current = newIdempotencyKey();
      toast.success(successMessage(res, 'Payment recorded'));
      invalidateInventoryPurchases(queryClient);
      onClose();
    },
    onError: (err) => {
      // The key is spent — it went through earlier with a different payload, or
      // matches a document voided since — so it can never succeed again: start
      // a fresh one and refresh the lists.
      const spent = spentKeyMessage(err);
      if (spent) {
        releaseKey(keyTarget);
        keyRef.current = newIdempotencyKey();
        invalidateInventoryPurchases(queryClient);
        toast.error(spent);
        return;
      }
      // Network/timeout etc.: keep the key so an unchanged retry is recognised.
      if (isUnknownOutcome(err)) {
        // It may have gone through: a cancel and reopen must reuse this key.
        holdKey(keyTarget, keyRef.current);
        invalidateInventoryPurchases(queryClient);
      }
      toast.error(err.message || 'Could not record the payment');
    },
  });

  const submit = () => {
    const next = {};
    const amountError = validateSupplierPayment(amount, balance);
    if (amountError) next.amount = amountError;
    if (orgTier && !branchId) next.branchId = 'Pick the paying branch';
    if (!date) next.date = 'Pick a date';
    setErrors(next);
    if (Object.keys(next).length) return;
    mutation.mutate({
      supplierId: supplier._id,
      ...(orgTier && branchId ? { branchId } : {}),
      date,
      amount: fromPaisa(toPaisa(amount)),
      method,
      ...(ledgerAccountId ? { ledgerAccountId } : {}),
      ...(reference.trim() ? { reference: reference.trim() } : {}),
      idempotencyKey: keyRef.current,
    });
  };

  // Closing mid-request and reopening mints a new idempotency key, so a retry
  // of a payment that did go through would record it twice.
  const closeIfIdle = () => {
    if (!mutation.isPending) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeIfIdle}
      title="Pay supplier"
      subtitle={supplier ? `${supplier.name} · balance ${money(balance)}` : ''}
      footer={
        <ModalFooter
          onCancel={closeIfIdle}
          onSubmit={submit}
          submitLabel="Record payment"
          loading={mutation.isPending}
        />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {orgTier && (
          <div className="sm:col-span-2">
            <label className={labelCls}>Paying branch *</label>
            <BranchSelect
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                setAccount('');
              }}
              allLabel="Select branch…"
            />
            {errors.branchId && <p className={errorCls}>{errors.branchId}</p>}
          </div>
        )}
        <div>
          <label className={labelCls}>Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
          {errors.date && <p className={errorCls}>{errors.date}</p>}
        </div>
        <div>
          <label className={labelCls}>Amount ({currencySymbol}) *</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className={inputCls}
          />
          {errors.amount && <p className={errorCls}>{errors.amount}</p>}
        </div>
        <div>
          <label className={labelCls}>Method</label>
          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setAccount('');
            }}
            className={inputCls}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Reference</label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Cheque / transfer no."
            maxLength={100}
            className={inputCls}
          />
        </div>
        {!(orgTier && !branchId) && (
          <div className="sm:col-span-2">
            <CashBankAccountSelect
              method={method}
              branchId={branchId || undefined}
              value={ledgerAccountId}
              onChange={setAccount}
              labelCls={labelCls}
              inputCls={inputCls}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
