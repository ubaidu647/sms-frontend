'use client';
// New school shop sale to a student. Stock leaves now; the amount is added to
// the student's NEXT fee voucher as a "School shop" line.
// POST /inventory/sales { studentId, date?, lines:[{ itemId, quantity, unitPrice? }] }.
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Info } from 'lucide-react';
import { Modal } from '@/component/Modal';
import { postData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { useTokenStore } from '@/store/tokenStore';
import {
  fromPaisa,
  isMoneyInput,
  lineAmountPaisa,
  saleTotalPaisa,
  stockShortfalls,
  toPaisa,
  validateQtyLine,
} from '@/utils/inventory';
import ItemSelect, { availabilityMap } from './ItemSelect';
import {
  ModalFooter,
  RemoveLineButton,
  StudentSearch,
  errorCls,
  idOf,
  inputCls,
  invalidateInventoryShop,
  labelCls,
  money,
  secondaryBtn,
  smallInputCls,
  useItemOptions,
} from './inventoryShared';

const blank = () => ({ itemId: '', quantity: '1', unitPrice: '' });

export default function ShopSaleFormModal({ isOpen, onClose, branchId: headerBranchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [student, setStudent] = useState(null);
  const [date, setDate] = useState(localYMD());
  const [lines, setLines] = useState([blank()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setStudent(null);
      setDate(localYMD());
      setLines([blank()]);
      setErrors({});
    }
  }, [isOpen]);

  // Stock is taken from the student's own branch.
  const studentBranch = idOf(student?.branchId || student?.branch) || headerBranchId || '';
  const { items } = useItemOptions({
    branchId: studentBranch,
    saleable: true,
    enabled: isOpen && !!student,
  });
  const saleable = items.filter((i) => i.isSaleable !== false);
  const avail = availabilityMap(saleable);
  const totalPaisa = saleTotalPaisa(lines);

  const setLine = (i, patch) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/inventory/sales', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Sale recorded — it will be added to the next fee voucher');
      invalidateInventoryShop(queryClient);
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Could not record the sale'),
  });

  const submit = () => {
    const lineErrors = lines.map((l) => {
      const e = validateQtyLine(l, avail[l.itemId]);
      if (!isMoneyInput(l.unitPrice) || toPaisa(l.unitPrice) <= 0) e.unitPrice = 'Enter a price';
      return e;
    });
    const next = { lines: lineErrors };
    if (!student) next.student = 'Pick a student';
    if (!date) next.date = 'Pick a date';
    if (stockShortfalls(lines, avail).length) next.short = 'Not enough stock for some items';
    setErrors(next);
    if (next.student || next.date || next.short || lineErrors.some((e) => Object.keys(e).length))
      return;
    mutation.mutate({
      studentId: student._id,
      date,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        quantity: Number(l.quantity),
        unitPrice: fromPaisa(toPaisa(l.unitPrice)),
      })),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New shop sale"
      size="lg"
      footer={
        <ModalFooter
          onCancel={onClose}
          onSubmit={submit}
          submitLabel="Record sale"
          loading={mutation.isPending}
        />
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2 items-start p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-sm text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            No cash is taken here. Pending sales are added to the student&apos;s next fee voucher as
            one &quot;School shop&quot; line.
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Student *</label>
            <StudentSearch
              value={student}
              branchId={headerBranchId}
              onChange={(s) => {
                setStudent(s);
                setLines([blank()]);
              }}
            />
            {errors.student && <p className={errorCls}>{errors.student}</p>}
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
                <div className="sm:col-span-6">
                  <ItemSelect
                    items={saleable}
                    value={l.itemId}
                    disabled={!student}
                    placeholder={student ? 'Select item…' : 'Pick the student first'}
                    showStock
                    showPrice
                    onChange={(v, it) =>
                      setLine(i, {
                        itemId: v,
                        unitPrice: it?.salePrice ? String(it.salePrice) : '',
                      })
                    }
                  />
                  {e.itemId && <p className={errorCls}>{e.itemId}</p>}
                </div>
                <div className="sm:col-span-2">
                  <input
                    value={l.quantity}
                    onChange={(ev) => setLine(i, { quantity: ev.target.value })}
                    placeholder="Qty"
                    inputMode="decimal"
                    className={smallInputCls}
                  />
                  {e.quantity && <p className={errorCls}>{e.quantity}</p>}
                </div>
                <div className="sm:col-span-2">
                  <input
                    value={l.unitPrice}
                    onChange={(ev) => setLine(i, { unitPrice: ev.target.value })}
                    placeholder="Price"
                    inputMode="decimal"
                    className={smallInputCls}
                  />
                  {e.unitPrice && <p className={errorCls}>{e.unitPrice}</p>}
                </div>
                <div className="sm:col-span-2 flex items-center justify-between gap-2 sm:pt-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {money(fromPaisa(lineAmountPaisa(l.quantity, l.unitPrice)))}
                  </span>
                  <RemoveLineButton
                    disabled={lines.length === 1}
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                  />
                </div>
              </div>
            );
          })}
          {errors.short && <p className={errorCls}>{errors.short}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className={secondaryBtn}
              disabled={!student}
              onClick={() => setLines((ls) => [...ls, blank()])}
            >
              <Plus className="w-4 h-4" />
              Add line
            </button>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              Total {money(fromPaisa(totalPaisa))}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
