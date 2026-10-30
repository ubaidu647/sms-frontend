'use client';
// New purchase: supplier, date, bill no., stock / asset / expense lines, paid
// now (cash/bank + account) vs. credit remainder owed to the supplier.
// POST /inventory/purchases → 201 (with the created asset tags).
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Modal } from '@/component/Modal';
import CashBankAccountSelect from '@/component/CashBankAccountSelect';
import { postData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import {
  idempotencyHeader,
  newIdempotencyKey,
  spentKeyMessage,
  successMessage,
} from '@/utils/idempotency';
import { useTokenStore } from '@/store/tokenStore';
import {
  ASSET_CONDITIONS,
  buildPurchasePayload,
  emptyPurchaseLine,
  fromPaisa,
  purchaseLinePaisa,
  purchaseTotals,
  validatePurchaseLines,
} from '@/utils/inventory';
import { BranchSelect } from '../leave/LeavePickers';
import ItemSelect from './ItemSelect';
import {
  ModalFooter,
  RemoveLineButton,
  errorCls,
  inputCls,
  invalidateInventoryPurchases,
  labelCls,
  money,
  secondaryBtn,
  smallInputCls,
  useItemOptions,
  useSupplierOptions,
} from './inventoryShared';

const KIND_LABELS = { stock: 'Stock item', asset: 'Fixed asset', expense: 'Expense' };

const initial = (branchId) => ({
  branchId: branchId || '',
  supplierId: '',
  date: localYMD(),
  billNumber: '',
  lines: [emptyPurchaseLine('stock')],
  paidAmount: '0',
  paymentMethod: 'cash',
  ledgerAccountId: '',
});

export default function PurchaseFormModal({
  isOpen,
  onClose,
  orgTier,
  defaultBranchId,
  onCreated,
}) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial(defaultBranchId));
  const [errors, setErrors] = useState({});
  const keyRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initial(defaultBranchId));
      setErrors({});
      keyRef.current = newIdempotencyKey();
    }
  }, [isOpen, defaultBranchId]);

  const { suppliers } = useSupplierOptions();
  const needBranch = orgTier && !form.branchId;
  const { items } = useItemOptions({ branchId: form.branchId, enabled: isOpen && !needBranch });
  const totals = purchaseTotals(form.lines, form.paidAmount);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setLine = (i, patch) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  const mutation = useMutation({
    mutationFn: (payload) =>
      postData({
        url: '/inventory/purchases',
        payload,
        token,
        headers: idempotencyHeader(keyRef.current),
      }),
    onSuccess: (res) => {
      keyRef.current = newIdempotencyKey();
      toast.success(successMessage(res, 'Purchase posted'));
      invalidateInventoryPurchases(queryClient);
      onClose();
      onCreated?.(res?.data);
    },
    onError: (err) => {
      // The key is spent — it went through earlier with a different payload, or
      // matches a document voided since — so it can never succeed again: start
      // a fresh one and refresh the lists.
      const spent = spentKeyMessage(err);
      if (spent) {
        keyRef.current = newIdempotencyKey();
        invalidateInventoryPurchases(queryClient);
        toast.error(spent);
        return;
      }
      // Network/timeout etc.: keep the key so an unchanged retry is recognised.
      toast.error(err.message || 'Could not post the purchase');
    },
  });

  const submit = () => {
    const lineCheck = validatePurchaseLines(form.lines);
    const next = { lines: lineCheck.lines };
    if (needBranch) next.branchId = 'Pick a branch';
    if (!form.supplierId) next.supplierId = 'Pick a supplier';
    if (!form.date) next.date = 'Pick a date';
    if (!form.lines.length) next.noLines = 'Add at least one line';
    if (!/^\d*(\.\d{0,2})?$/.test(String(form.paidAmount).trim()))
      next.paidAmount = 'Enter a valid amount';
    else if (totals.paidError) next.paidAmount = totals.paidError;
    setErrors(next);
    if (
      lineCheck.hasErrors ||
      next.branchId ||
      next.supplierId ||
      next.date ||
      next.noLines ||
      next.paidAmount
    )
      return;
    mutation.mutate(buildPurchasePayload({ ...form, branchId: orgTier ? form.branchId : '' }));
  };

  const lineField = (i, key, props = {}) => {
    const e = errors.lines?.[i] || {};
    return (
      <div className={props.wrap || ''}>
        <input
          value={form.lines[i][key] ?? ''}
          onChange={(ev) => setLine(i, { [key]: ev.target.value })}
          className={smallInputCls}
          placeholder={props.placeholder}
          inputMode={props.inputMode}
          maxLength={props.maxLength}
          list={props.list}
        />
        {e[key] && <p className={errorCls}>{e[key]}</p>}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New purchase"
      size="xl"
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={submit}
          submitLabel="Post purchase"
          loading={mutation.isPending}
        />
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {orgTier && (
            <div>
              <label className={labelCls}>Branch *</label>
              <BranchSelect
                value={form.branchId}
                onChange={(v) =>
                  set({
                    branchId: v,
                    ledgerAccountId: '',
                    lines: form.lines.map((l) => (l.kind === 'stock' ? { ...l, itemId: '' } : l)),
                  })
                }
                allLabel="Select branch…"
              />
              {errors.branchId && <p className={errorCls}>{errors.branchId}</p>}
            </div>
          )}
          <div>
            <label className={labelCls}>Supplier *</label>
            <select
              value={form.supplierId}
              onChange={(e) => set({ supplierId: e.target.value })}
              className={inputCls}
            >
              <option value="">Select supplier…</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supplierId && <p className={errorCls}>{errors.supplierId}</p>}
          </div>
          <div>
            <label className={labelCls}>Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
              className={inputCls}
            />
            {errors.date && <p className={errorCls}>{errors.date}</p>}
          </div>
          <div>
            <label className={labelCls}>Supplier bill no.</label>
            <input
              value={form.billNumber}
              onChange={(e) => set({ billNumber: e.target.value })}
              maxLength={50}
              className={inputCls}
            />
          </div>
        </div>

        <div className="space-y-3">
          {form.lines.map((l, i) => {
            const e = errors.lines?.[i] || {};
            return (
              <div
                key={i}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={l.kind}
                    onChange={(ev) =>
                      setForm((f) => ({
                        ...f,
                        lines: f.lines.map((x, j) =>
                          j === i ? emptyPurchaseLine(ev.target.value) : x,
                        ),
                      }))
                    }
                    className={`${smallInputCls} sm:w-40`}
                  >
                    {Object.entries(KIND_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                    {money(fromPaisa(purchaseLinePaisa(l)))}
                  </span>
                  <RemoveLineButton
                    disabled={form.lines.length === 1}
                    onClick={() =>
                      setForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }))
                    }
                  />
                </div>
                {l.kind === 'stock' && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <ItemSelect
                        items={items}
                        value={l.itemId}
                        disabled={needBranch}
                        placeholder={needBranch ? 'Select branch first' : 'Select item…'}
                        showStock
                        onChange={(v) => setLine(i, { itemId: v })}
                      />
                      {e.itemId && <p className={errorCls}>{e.itemId}</p>}
                    </div>
                    {lineField(i, 'quantity', {
                      wrap: 'sm:col-span-3',
                      placeholder: 'Qty',
                      inputMode: 'decimal',
                    })}
                    {lineField(i, 'unitCost', {
                      wrap: 'sm:col-span-3',
                      placeholder: 'Unit cost',
                      inputMode: 'decimal',
                    })}
                  </div>
                )}
                {l.kind === 'asset' && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {lineField(i, 'name', {
                      wrap: 'sm:col-span-4',
                      placeholder: 'Asset name (e.g. Projector)',
                      maxLength: 200,
                    })}
                    {lineField(i, 'category', {
                      wrap: 'sm:col-span-3',
                      placeholder: 'Category',
                      maxLength: 100,
                    })}
                    {lineField(i, 'quantity', {
                      wrap: 'sm:col-span-2',
                      placeholder: 'Qty',
                      inputMode: 'numeric',
                    })}
                    {lineField(i, 'unitCost', {
                      wrap: 'sm:col-span-3',
                      placeholder: 'Unit cost',
                      inputMode: 'decimal',
                    })}
                    {lineField(i, 'location', {
                      wrap: 'sm:col-span-6',
                      placeholder: 'Location / room (optional)',
                      maxLength: 100,
                    })}
                    <div className="sm:col-span-3">
                      <select
                        value={l.condition || 'new'}
                        onChange={(ev) => setLine(i, { condition: ev.target.value })}
                        className={smallInputCls}
                      >
                        {ASSET_CONDITIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="sm:col-span-12 text-xs text-gray-500 dark:text-gray-400">
                      Creates one asset per unit with consecutive tag numbers.
                    </p>
                  </div>
                )}
                {l.kind === 'expense' && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {lineField(i, 'description', {
                      wrap: 'sm:col-span-9',
                      placeholder: 'Description (e.g. delivery, repairs)',
                      maxLength: 300,
                    })}
                    {lineField(i, 'amount', {
                      wrap: 'sm:col-span-3',
                      placeholder: 'Amount',
                      inputMode: 'decimal',
                    })}
                  </div>
                )}
                {e.kind && <p className={errorCls}>{e.kind}</p>}
              </div>
            );
          })}
          {errors.noLines && <p className={errorCls}>{errors.noLines}</p>}
          <div className="flex flex-wrap gap-2">
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={secondaryBtn}
                onClick={() => set({ lines: [...form.lines, emptyPurchaseLine(k)] })}
              >
                <Plus className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Paid now (Rs)</label>
                <input
                  value={form.paidAmount}
                  onChange={(e) => set({ paidAmount: e.target.value })}
                  inputMode="decimal"
                  className={inputCls}
                />
                {errors.paidAmount && <p className={errorCls}>{errors.paidAmount}</p>}
              </div>
              <div>
                <label className={labelCls}>Paid by</label>
                <select
                  value={form.paymentMethod}
                  disabled={totals.paidPaisa <= 0}
                  onChange={(e) => set({ paymentMethod: e.target.value, ledgerAccountId: '' })}
                  className={inputCls}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
            </div>
            {totals.paidPaisa > 0 && !needBranch && (
              <CashBankAccountSelect
                method={form.paymentMethod}
                branchId={form.branchId || undefined}
                value={form.ledgerAccountId}
                onChange={(v) => set({ ledgerAccountId: v })}
                labelCls={labelCls}
                inputCls={inputCls}
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => set({ paidAmount: String(totals.total) })}
              >
                Pay in full
              </button>
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => set({ paidAmount: '0' })}
              >
                All on credit
              </button>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {money(totals.total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Paid now</span>
              <span className="text-gray-900 dark:text-gray-100">{money(totals.paid)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-600 dark:text-gray-400">On credit (supplier payable)</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {money(totals.credit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
