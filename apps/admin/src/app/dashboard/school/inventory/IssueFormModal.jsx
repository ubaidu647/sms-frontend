'use client';
// Issue stock to a department / staff member / other:
// POST /inventory/issues { branchId?, date, issuedTo: { type, staffId?, name }, lines:[{ itemId, quantity }] }.
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Modal } from '@/component/Modal';
import { postData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { useTokenStore } from '@/store/tokenStore';
import { ISSUED_TO_TYPES, stockShortfalls, validateQtyLine } from '@/utils/inventory';
import { BranchSelect, StaffSelect, staffLabel } from '../leave/LeavePickers';
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

export default function IssueFormModal({ isOpen, onClose, orgTier, defaultBranchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(localYMD());
  const [toType, setToType] = useState('department');
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [lines, setLines] = useState([blank()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setBranchId(defaultBranchId || '');
      setDate(localYMD());
      setToType('department');
      setStaffId('');
      setName('');
      setLines([blank()]);
      setErrors({});
    }
  }, [isOpen, defaultBranchId]);

  const needBranch = orgTier && !branchId;
  const { items } = useItemOptions({ branchId, enabled: isOpen && !needBranch });
  const avail = availabilityMap(items);

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/inventory/issues', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Stock issued');
      invalidateInventoryStock(queryClient);
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Could not issue stock'),
  });

  const setLine = (i, patch) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const submit = () => {
    const lineErrors = lines.map((l) => validateQtyLine(l, avail[l.itemId]));
    const next = { lines: lineErrors };
    if (needBranch) next.branchId = 'Pick a branch';
    if (!date) next.date = 'Pick a date';
    if (toType === 'staff' && !staffId) next.to = 'Pick a staff member';
    if (toType !== 'staff' && !name.trim())
      next.to = toType === 'department' ? 'Department name is required' : 'Name is required';
    if (stockShortfalls(lines, avail).length) next.short = 'Not enough stock for some items';
    setErrors(next);
    if (
      next.branchId ||
      next.date ||
      next.to ||
      next.short ||
      lineErrors.some((e) => Object.keys(e).length)
    )
      return;
    mutation.mutate({
      ...(orgTier && branchId ? { branchId } : {}),
      date,
      issuedTo: {
        type: toType,
        name: name.trim(),
        ...(toType === 'staff' ? { staffId } : {}),
      },
      lines: lines.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue stock"
      size="lg"
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={submit}
          submitLabel="Issue"
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
                  setStaffId('');
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
            <label className={labelCls}>Issue to *</label>
            <select
              value={toType}
              onChange={(e) => {
                setToType(e.target.value);
                setStaffId('');
                setName('');
              }}
              className={inputCls}
            >
              {ISSUED_TO_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              {toType === 'staff'
                ? 'Staff member *'
                : toType === 'department'
                  ? 'Department *'
                  : 'Name *'}
            </label>
            {toType === 'staff' ? (
              <StaffSelect
                value={staffId}
                branchId={branchId || undefined}
                onChange={(id, row) => {
                  setStaffId(id);
                  setName(row ? staffLabel(row) : '');
                }}
              />
            ) : (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={toType === 'department' ? 'e.g. Science lab, Admin office' : ''}
                maxLength={200}
                className={inputCls}
              />
            )}
            {errors.to && <p className={errorCls}>{errors.to}</p>}
          </div>
        </div>

        <div className="space-y-3">
          {lines.map((l, i) => {
            const e = errors.lines?.[i] || {};
            const it = items.find((x) => x._id === l.itemId);
            return (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="sm:col-span-8">
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
                <div className="sm:col-span-3">
                  <input
                    value={l.quantity}
                    onChange={(ev) => setLine(i, { quantity: ev.target.value })}
                    placeholder={it ? `Qty (${it.unit || 'pcs'})` : 'Qty'}
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
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Issued stock is charged at the branch&apos;s average cost.
        </p>
      </div>
    </Modal>
  );
}
