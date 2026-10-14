'use client';
// Shared bits for the Inventory screens (styles, badges, pickers, queries,
// cache invalidation, printing).
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import { formatAmount } from '@/utils/money';
import { invalidateFeeQueries } from '@/utils/feeQueries';
import { ymdOf } from '@/utils/library';
import { ASSET_STATUS_COLORS, DOC_STATUS_COLORS, buildPrintHtml, refName } from '@/utils/inventory';
import Button from '@/component/Button';
import ConfirmModal from './ConfirmModal';
import { inputCls, labelCls, errorCls } from '../library/libraryShared';

export {
  inputCls,
  labelCls,
  primaryBtn,
  secondaryBtn,
  dangerBtn,
  cardCls,
  thCls,
  tdCls,
  errorCls,
  Spinner,
} from '../library/libraryShared';

export const smallInputCls =
  'w-full bg-white dark:bg-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:opacity-60';

export const linkBtn = 'text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline';

/** Stored date-only value → 'YYYY-MM-DD', '—' when empty. */
export const fmtDate = (v) => ymdOf(v) || '—';

export const money = (n) => `Rs ${formatAmount(n)}`;

export const fmtQty = (n) =>
  (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function Badge({ cls, children }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${cls}`}
    >
      {children}
    </span>
  );
}

export const StatusBadge = ({ status }) => (
  <Badge cls={DOC_STATUS_COLORS[status] || DOC_STATUS_COLORS.void}>{status || '—'}</Badge>
);

export const AssetStatusBadge = ({ status }) => (
  <Badge cls={ASSET_STATUS_COLORS[status] || ASSET_STATUS_COLORS.disposed}>
    {String(status || '—').replace('-', ' ')}
  </Badge>
);

export const LowStockBadge = () => (
  <Badge cls="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Low stock</Badge>
);

/** Item name of a document line whose item ref may be populated. */
export const lineItemName = (l) =>
  refName(l?.itemId, '') || refName(l?.item, '') || l?.itemName || l?.name || '—';

/** id of a possibly-populated ref. */
export const idOf = (ref) => String(ref?._id || ref || '');

/* ------------------------------ Invalidation ------------------------------ */

const invalidate = (queryClient, keys) =>
  keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

/** Items, stock levels, movements, issues — after any stock mutation. */
export function invalidateInventoryStock(queryClient) {
  invalidate(queryClient, [
    'inventory-summary',
    'inventory-items',
    'inventory-item-options',
    'inventory-movements',
    'inventory-issues',
  ]);
}

/** After a purchase / supplier / supplier payment mutation. */
export function invalidateInventoryPurchases(queryClient) {
  invalidateInventoryStock(queryClient);
  invalidate(queryClient, [
    'inventory-purchases',
    'inventory-purchase',
    'inventory-suppliers',
    'inventory-supplier-options',
    'inventory-supplier-statement',
    'inventory-supplier-payments',
    'inventory-assets',
    'inventory-asset',
  ]);
}

/** After an asset mutation. */
export function invalidateInventoryAssets(queryClient) {
  invalidate(queryClient, ['inventory-summary', 'inventory-assets', 'inventory-asset']);
}

/** After a shop sale / void — pending sales feed the student's next fee voucher. */
export function invalidateInventoryShop(queryClient) {
  invalidateInventoryStock(queryClient);
  invalidate(queryClient, ['inventory-sales']);
  invalidateFeeQueries(queryClient);
}

/* -------------------------------- Queries -------------------------------- */

/**
 * Active items with the branch's stock figures, for line pickers.
 * `branchId` '' = the caller's own branch (or all branches for org tier).
 */
export function useItemOptions({ branchId = '', saleable = false, enabled = true } = {}) {
  const { accessToken: token } = useTokenStore();
  const query = useQuery({
    queryKey: ['inventory-item-options', branchId || '', saleable],
    queryFn: () =>
      fetchData({
        url: '/inventory/items',
        page: 1,
        limit: 1000,
        token,
        ...(branchId ? { branchId } : {}),
        ...(saleable ? { saleable: true } : {}),
      }),
    enabled: !!token && enabled,
    staleTime: 15000,
  });
  const items = useMemo(
    () => (query.data?.data || []).filter((i) => i.isActive !== false),
    [query.data],
  );
  return { ...query, items };
}

export function useSupplierOptions() {
  const { accessToken: token } = useTokenStore();
  const query = useQuery({
    queryKey: ['inventory-supplier-options'],
    queryFn: () => fetchData({ url: '/inventory/suppliers', page: 1, limit: 1000, token }),
    enabled: !!token,
    staleTime: 30000,
  });
  const suppliers = useMemo(
    () => (query.data?.data || []).filter((s) => s.isActive !== false),
    [query.data],
  );
  return { ...query, suppliers };
}

/* ------------------------------- Pickers -------------------------------- */

/** Search-as-you-type active student picker; reports the full student row. */
export function StudentSearch({ value, onChange, branchId }) {
  const { accessToken: token } = useTokenStore();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const term = search.trim();

  const { data, isFetching } = useQuery({
    queryKey: ['inventory-student-search', term, branchId || ''],
    queryFn: () =>
      fetchData({
        url: '/student/list',
        page: 1,
        limit: 10,
        token,
        search: term,
        isActive: true,
        ...(branchId ? { branchId } : {}),
      }),
    enabled: !!token && term.length >= 2,
    staleTime: 10000,
  });
  const students = data?.data || [];

  if (value) {
    const cls = [value.class?.name, value.section?.name].filter(Boolean).join(' - ');
    return (
      <div className="flex items-center justify-between gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-teal-50 dark:bg-teal-950/40">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {value.user?.name || value.name || 'Student'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {[value.admissionNumber, cls, value.branch?.name || value.branchId?.name]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setOpen(false);
            onChange(null);
          }}
          className="text-xs text-red-600 hover:underline shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        placeholder="Type name or admission #..."
        className={inputCls}
      />
      {open && term.length >= 2 && students.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {students.map((s) => {
            const cls = [s.class?.name, s.section?.name].filter(Boolean).join(' - ');
            return (
              <li
                key={s._id}
                className="px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer text-sm"
                onClick={() => {
                  setOpen(false);
                  onChange(s);
                }}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {s.user?.name || s.name || 'Student'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {[s.admissionNumber, cls].filter(Boolean).join(' · ') || '—'}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {open && term.length >= 2 && !isFetching && data && students.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No students found.</p>
      )}
    </div>
  );
}

/** Confirm with a required reason (voids). */
export function ReasonModal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Void',
  loading,
  onConfirm,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      confirmTone="danger"
      loading={loading}
      onConfirm={() => {
        const r = reason.trim();
        if (!r) {
          setError('Reason is required');
          return;
        }
        onConfirm(r);
      }}
    >
      <div className="mt-3">
        <label className={labelCls}>Reason *</label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError('');
          }}
          rows={3}
          maxLength={500}
          className={inputCls}
        />
        {error && <p className={errorCls}>{error}</p>}
      </div>
    </ConfirmModal>
  );
}

/** Side drawer (right) used for item movements. */
export function Drawer({ isOpen, onClose, title, subtitle, children }) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 px-2"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">{children}</div>
      </aside>
    </>
  );
}

/** Opens a plain printable sheet in a new window and prints it. */
export function printSheet(spec) {
  if (typeof window === 'undefined') return;
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) {
    window.alert('Allow pop-ups for this site to print.');
    return;
  }
  w.document.open();
  w.document.write(buildPrintHtml(spec));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}

/** Cancel + submit footer for the inventory modals (submit disables while loading). */
export function ModalFooter({ onCancel, onSubmit, submitLabel = 'Save', loading = false }) {
  return (
    <div className="flex gap-3">
      <Button
        label="Cancel"
        handleClick={onCancel}
        styleObject={{
          baseColor: 'bg-white border border-gray-300',
          hoverColor: 'hover:bg-gray-50',
          rounded: 'rounded-full',
          size: 'px-8 py-3 text-md min-h-[3rem]',
          textColor: 'text-gray-700',
        }}
      />
      <Button
        label={submitLabel}
        loading={loading}
        handleClick={onSubmit}
        styleObject={{
          baseColor: 'bg-teal-600',
          hoverColor: 'hover:bg-teal-700',
          rounded: 'rounded-full',
          size: 'px-8 py-3 text-md min-h-[3rem]',
          textColor: 'text-white',
        }}
      />
    </div>
  );
}

/** Small "remove line" button for multi-line editors. */
export function RemoveLineButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-40 disabled:no-underline"
    >
      Remove
    </button>
  );
}
