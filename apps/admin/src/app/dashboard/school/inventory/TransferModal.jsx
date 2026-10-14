'use client';
// Branch-to-branch stock transfer (org tier only):
// POST /inventory/transfers { fromBranchId, toBranchId, date, lines:[{ itemId, quantity }], note? }.
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Modal } from '@/component/Modal';
import { postData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { useTokenStore } from '@/store/tokenStore';
import { stockShortfalls, validateQtyLine } from '@/utils/inventory';
import { BranchSelect } from '../leave/LeavePickers';
import ItemSelect, { availabilityMap } from './ItemSelect';
import {
  ModalFooter,
  RemoveLineButton,
  errorCls,
  inputCls,
  invalidateInventoryStock,
  labelCls,
  secondaryBtn,
  smallInputCls,
  useItemOptions,
} from './inventoryShared';

const blank = () => ({ itemId: '', quantity: '' });

export default function TransferModal({ isOpen, onClose, defaultBranchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [fromBranchId, setFrom] = useState('');
  const [toBranchId, setTo] = useState('');
  const [date, setDate] = useState(localYMD());
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([blank()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFrom(defaultBranchId || '');
      setTo('');
      setDate(localYMD());
      setNote('');
      setLines([blank()]);
      setErrors({});
    }
  }, [isOpen, defaultBranchId]);

  const { items } = useItemOptions({ branchId: fromBranchId, enabled: isOpen && !!fromBranchId });
  const avail = availabilityMap(items);

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/inventory/transfers', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Stock transferred');
      invalidateInventoryStock(queryClient);
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Could not transfer stock'),
  });

  const setLine = (i, patch) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const submit = () => {
    const lineErrors = lines.map((l) => validateQtyLine(l, avail[l.itemId]));
    const next = { lines: lineErrors };
    if (!fromBranchId) next.from = 'Pick the source branch';
    if (!toBranchId) next.to = 'Pick the destination branch';
    else if (toBranchId === fromBranchId) next.to = 'Pick a different branch';
    if (!date) next.date = 'Pick a date';
    const short = stockShortfalls(lines, avail);
    if (short.length) next.short = 'Some items are short in the source branch';
    setErrors(next);
    if (
      next.from ||
      next.to ||
      next.date ||
      next.short ||
      lineErrors.some((e) => Object.keys(e).length)
    )
      return;
    mutation.mutate({
      fromBranchId,
      toBranchId,
      date,
      lines: lines.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Branch transfer"
      size="lg"
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={submit}
          submitLabel="Transfer"
          loading={mutation.isPending}
        />
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>From branch *</label>
            <BranchSelect
              value={fromBranchId}
              onChange={(v) => {
                setFrom(v);
                setLines([blank()]);
              }}
              allLabel="Select branch…"
            />
            {errors.from && <p className={errorCls}>{errors.from}</p>}
          </div>
          <div>
            <label className={labelCls}>To branch *</label>
            <BranchSelect value={toBranchId} onChange={setTo} allLabel="Select branch…" />
            {errors.to && <p className={errorCls}>{errors.to}</p>}
          </div>
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
        </div>

        <div className="space-y-3">
          {lines.map((l, i) => {
            const e = errors.lines?.[i] || {};
            return (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="sm:col-span-8">
                  <ItemSelect
                    items={items}
                    value={l.itemId}
                    disabled={!fromBranchId}
                    placeholder={fromBranchId ? 'Select item…' : 'Select source branch first'}
                    showStock
                    onChange={(v) => setLine(i, { itemId: v })}
                  />
                  {e.itemId && <p className={errorCls}>{e.itemId}</p>}
                </div>
                <div className="sm:col-span-3">
                  <input
                    value={l.quantity}
                    onChange={(ev) => setLine(i, { quantity: ev.target.value })}
                    placeholder="Qty"
                    inputMode="decimal"
                    className={smallInputCls}
                  />
                  {e.quantity && <p className={errorCls}>{e.quantity}</p>}
                </div>
                <div className="sm:col-span-1 sm:pt-2">
                  <RemoveLineButton
                    disabled={lines.length === 1}
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                  />
                </div>
              </div>
            );
          })}
          {errors.short && <p className={errorCls}>{errors.short}</p>}
          <button
            type="button"
            className={secondaryBtn}
            onClick={() => setLines((ls) => [...ls, blank()])}
          >
            <Plus className="w-4 h-4" />
            Add line
          </button>
        </div>
        <div>
          <label className={labelCls}>Note</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
