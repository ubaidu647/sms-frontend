'use client';
// Asset actions:
//   status   → PATCH /inventory/assets/:id/status { status, note? }
//   transfer → POST  /inventory/assets/:id/transfer { toBranchId?, location?, assignedToStaffId?, note? }
//   dispose  → POST  /inventory/assets/:id/dispose { status: 'disposed'|'lost', reason, disposalValue?, ledgerAccountId? }
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import CashBankAccountSelect from '@/component/CashBankAccountSelect';
import { patchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { assetStatusTargets, fromPaisa, toPaisa, validateDisposalValue } from '@/utils/inventory';
import { BranchSelect, StaffSelect } from '../leave/LeavePickers';
import {
  ModalFooter,
  errorCls,
  idOf,
  inputCls,
  invalidateInventoryAssets,
  labelCls,
  money,
} from './inventoryShared';

const TITLES = {
  status: 'Change status',
  transfer: 'Transfer asset',
  dispose: 'Dispose / write off',
};

export default function AssetActionModal({ asset, mode, onClose, orgTier }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const isOpen = !!asset && !!mode;
  const [f, setF] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (mode === 'status') setF({ status: assetStatusTargets(asset.status)[0] || '', note: '' });
    if (mode === 'transfer')
      setF({
        toBranchId: '',
        location: asset.location || '',
        assignedToStaffId: idOf(asset.assignedToStaffId),
        note: '',
      });
    if (mode === 'dispose')
      setF({ status: 'disposed', reason: '', disposalValue: '', ledgerAccountId: '' });
  }, [isOpen, mode, asset]);

  const set = (patch) => setF((x) => ({ ...x, ...patch }));

  const mutation = useMutation({
    mutationFn: (payload) => {
      const base = `/inventory/assets/${asset._id}`;
      if (mode === 'status') return patchData({ url: `${base}/status`, payload, token });
      return postData({ url: `${base}/${mode}`, payload, token });
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Asset updated');
      invalidateInventoryAssets(queryClient);
      onClose();
    },
    // Keep the server's reason (closed period, missing account mapping, a cash
    // head to pick…) on screen, not only in a toast that fades.
    onError: (err) => {
      const msg = err.message || 'Could not update the asset';
      setErrors((x) => ({ ...x, server: msg }));
      toast.error(msg);
    },
  });

  const submit = () => {
    const next = {};
    let payload = {};
    if (mode === 'status') {
      if (!f.status) next.status = 'Pick a status';
      payload = { status: f.status, ...(f.note?.trim() ? { note: f.note.trim() } : {}) };
    }
    if (mode === 'transfer') {
      const sameBranch = !f.toBranchId || f.toBranchId === idOf(asset.branchId);
      const locChanged = (f.location || '').trim() !== (asset.location || '');
      const staffChanged = (f.assignedToStaffId || '') !== idOf(asset.assignedToStaffId);
      if (sameBranch && !locChanged && !staffChanged)
        next.form = 'Change the branch, location or assigned staff';
      payload = {
        ...(!sameBranch ? { toBranchId: f.toBranchId } : {}),
        ...(locChanged ? { location: f.location.trim() } : {}),
        ...(staffChanged || !sameBranch ? { assignedToStaffId: f.assignedToStaffId || null } : {}),
        ...(f.note?.trim() ? { note: f.note.trim() } : {}),
      };
    }
    if (mode === 'dispose') {
      if (!f.reason?.trim()) next.reason = 'Reason is required';
      const dvErr = validateDisposalValue(f.disposalValue, asset.cost);
      if (dvErr) next.disposalValue = dvErr;
      const dv = toPaisa(f.disposalValue);
      payload = {
        status: f.status,
        reason: f.reason?.trim(),
        ...(dv > 0 ? { disposalValue: fromPaisa(dv) } : {}),
        ...(dv > 0 && f.ledgerAccountId ? { ledgerAccountId: f.ledgerAccountId } : {}),
      };
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    mutation.mutate(payload);
  };

  if (!isOpen) return null;
  const targets = assetStatusTargets(asset.status);
  const assetBranch = idOf(asset.branchId);
  const staffBranch = f.toBranchId || assetBranch;
  const dvPaisa = toPaisa(f.disposalValue);
  const loss = fromPaisa(Math.max(0, toPaisa(asset.cost) - dvPaisa));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={TITLES[mode]}
      subtitle={`${asset.tagNumber || ''} · ${asset.name || ''}`}
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={submit}
          submitLabel={mode === 'dispose' ? 'Write off' : 'Save'}
          loading={mutation.isPending}
        />
      }
    >
      <div className="space-y-3">
        {errors.server && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {errors.server}
          </div>
        )}
        {mode === 'status' && (
          <>
            <div>
              <label className={labelCls}>New status *</label>
              <select
                value={f.status || ''}
                onChange={(e) => set({ status: e.target.value })}
                className={inputCls}
              >
                {targets.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('-', ' ')}
                  </option>
                ))}
              </select>
              {errors.status && <p className={errorCls}>{errors.status}</p>}
            </div>
            <div>
              <label className={labelCls}>Note</label>
              <input
                value={f.note || ''}
                onChange={(e) => set({ note: e.target.value })}
                maxLength={300}
                className={inputCls}
              />
            </div>
          </>
        )}

        {mode === 'transfer' && (
          <>
            {orgTier && (
              <div>
                <label className={labelCls}>To branch</label>
                <BranchSelect
                  value={f.toBranchId || ''}
                  onChange={(v) => set({ toBranchId: v, assignedToStaffId: '' })}
                  allLabel="Same branch"
                />
              </div>
            )}
            <div>
              <label className={labelCls}>Location / room</label>
              <input
                value={f.location || ''}
                onChange={(e) => set({ location: e.target.value })}
                maxLength={100}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Assigned to</label>
              <StaffSelect
                value={f.assignedToStaffId || ''}
                branchId={staffBranch || undefined}
                placeholder="Not assigned"
                onChange={(id) => set({ assignedToStaffId: id })}
              />
            </div>
            <div>
              <label className={labelCls}>Note</label>
              <input
                value={f.note || ''}
                onChange={(e) => set({ note: e.target.value })}
                maxLength={300}
                className={inputCls}
              />
            </div>
            {errors.form && <p className={errorCls}>{errors.form}</p>}
          </>
        )}

        {mode === 'dispose' && (
          <>
            <div>
              <label className={labelCls}>Outcome *</label>
              <select
                value={f.status || 'disposed'}
                onChange={(e) => set({ status: e.target.value })}
                className={inputCls}
              >
                <option value="disposed">Disposed / sold / scrapped</option>
                <option value="lost">Lost / stolen</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Reason *</label>
              <textarea
                value={f.reason || ''}
                onChange={(e) => set({ reason: e.target.value })}
                rows={2}
                maxLength={500}
                className={inputCls}
              />
              {errors.reason && <p className={errorCls}>{errors.reason}</p>}
            </div>
            <div>
              <label className={labelCls}>Amount received (Rs)</label>
              <input
                value={f.disposalValue || ''}
                onChange={(e) => set({ disposalValue: e.target.value })}
                inputMode="decimal"
                placeholder="0"
                className={inputCls}
              />
              {errors.disposalValue && <p className={errorCls}>{errors.disposalValue}</p>}
            </div>
            {dvPaisa > 0 && (
              <CashBankAccountSelect
                method="cash"
                // The write-off posts under the branch whose books carry the
                // asset (where it was bought), even after a transfer. Asking by
                // asset lets a branch-tier manager reach that branch's heads.
                assetId={asset._id}
                branchId={idOf(asset.booksBranchId) || assetBranch || undefined}
                value={f.ledgerAccountId || ''}
                onChange={(v) => set({ ledgerAccountId: v })}
                labelCls={labelCls}
                inputCls={inputCls}
              />
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cost {money(asset.cost)} · loss written off {money(loss)}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
