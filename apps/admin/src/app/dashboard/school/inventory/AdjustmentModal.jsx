'use client';
// Stock adjustment (count corrections, damage, found stock):
// POST /inventory/adjustments { branchId?, date, lines:[{ itemId, quantityDelta, reason }] }.
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Modal } from '@/component/Modal';
import { postData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { useTokenStore } from '@/store/tokenStore';
import { validateAdjustmentLine } from '@/utils/inventory';
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

const blank = () => ({ itemId: '', quantityDelta: '', reason: '' });

export default function AdjustmentModal({ isOpen, onClose, orgTier, defaultBranchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(localYMD());
  const [lines, setLines] = useState([blank()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setBranchId(defaultBranchId || '');
      setDate(localYMD());
      setLines([blank()]);
      setErrors({});
    }
  }, [isOpen, defaultBranchId]);

  const needBranch = orgTier && !branchId;
  const { items } = useItemOptions({ branchId, enabled: isOpen && !needBranch });
  const avail = availabilityMap(items);

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/inventory/adjustments', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Stock adjusted');
      invalidateInventoryStock(queryClient);
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Could not adjust stock'),
  });

  const setLine = (i, patch) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const submit = () => {
    const lineErrors = lines.map((l) => validateAdjustmentLine(l, avail[l.itemId]));
    const next = { lines: lineErrors };
    if (orgTier && !branchId) next.branchId = 'Pick a branch';
    if (!date) next.date = 'Pick a date';
    setErrors(next);
    if (next.branchId || next.date || lineErrors.some((e) => Object.keys(e).length)) return;
    mutation.mutate({
      ...(orgTier && branchId ? { branchId } : {}),
      date,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        quantityDelta: Number(l.quantityDelta),
        reason: l.reason.trim(),
      })),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock adjustment"
      subtitle="Positive quantities add stock, negative quantities remove it."
      size="lg"
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={submit}
          submitLabel="Post adjustment"
          loading={mutation.isPending}
        />
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orgTier && (
            <div>
              <label className={labelCls}>Branch *</label>
              <BranchSelect
                value={branchId}
                onChange={(v) => {
                  setBranchId(v);
                  setLines([blank()]);
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
        </div>

        <div className="space-y-3">
          {lines.map((l, i) => {
            const e = errors.lines?.[i] || {};
            return (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="sm:col-span-5">
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
                <div className="sm:col-span-2">
                  <input
                    value={l.quantityDelta}
                    onChange={(ev) => setLine(i, { quantityDelta: ev.target.value })}
                    placeholder="± qty"
                    inputMode="decimal"
                    className={smallInputCls}
                  />
                  {e.quantityDelta && <p className={errorCls}>{e.quantityDelta}</p>}
                </div>
                <div className="sm:col-span-4">
                  <input
                    value={l.reason}
                    onChange={(ev) => setLine(i, { reason: ev.target.value })}
                    placeholder="Reason (e.g. damaged, recount)"
                    maxLength={300}
                    className={smallInputCls}
                  />
                  {e.reason && <p className={errorCls}>{e.reason}</p>}
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
          <button
            type="button"
            className={secondaryBtn}
            onClick={() => setLines((ls) => [...ls, blank()])}
          >
            <Plus className="w-4 h-4" />
            Add line
          </button>
        </div>
      </div>
    </Modal>
  );
}
