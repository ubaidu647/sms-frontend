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
import { idempotencyHeader, newIdempotencyKey } from '@/utils/idempotency';
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

export default function SupplierPaymentModal({ supplier, onClose, orgTier, defaultBranchId }) {
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
      keyRef.current = newIdempotencyKey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplier?._id, defaultBranchId]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      postData({
        url: '/inventory/supplier-payments',
        payload,
        token,
        headers: idempotencyHeader(keyRef.current),
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Payment recorded');
      invalidateInventoryPurchases(queryClient);
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Could not record the payment'),
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
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pay supplier"
      subtitle={supplier ? `${supplier.name} · balance ${money(balance)}` : ''}
      footer={
        <ModalFooter
          onCancel={onClose}
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
          <label className={labelCls}>Amount (Rs) *</label>
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
