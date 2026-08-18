'use client';
import React, { useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import CashBankAccountSelect from '@/component/CashBankAccountSelect';
import toast from 'react-hot-toast';
import {
  PAYSLIP_STATUS_COLORS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  REFERENCE_REQUIRED_METHODS,
  formatMoney,
  formatMonth,
  formatDate,
} from '@/constants/staffSalary';
import { Lock, DollarSign, XCircle, Edit3 } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function PayslipDetailModal({ isOpen, onClose, payslipId }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [showPay, setShowPay] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canUpdate =
    isAdmin || actions.includes('update-payslip') || actions.includes('update-all-branch-payslip');
  const canPay =
    isAdmin || actions.includes('pay-payslip') || actions.includes('pay-all-branch-payslip');
  const canCancel =
    isAdmin || actions.includes('cancel-payslip') || actions.includes('cancel-all-branch-payslip');

  const { data, isFetching } = useQuery({
    queryKey: ['payslip-detail', payslipId],
    queryFn: () => fetchData({ url: `/staff-salary/payslip/${payslipId}`, token }),
    enabled: !!token && isOpen && !!payslipId,
    staleTime: 0,
  });
  const payslip = data?.data ?? data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payslips'] });
    queryClient.invalidateQueries({ queryKey: ['payslip-detail', payslipId] });
    queryClient.invalidateQueries({ queryKey: ['payslip-summary'] });
  };

  const finalizeMut = useMutation({
    mutationFn: () =>
      postData({
        url: `/staff-salary/payslip/${payslipId}/finalize`,
        payload: {},
        token,
      }),
    onSuccess: () => {
      toast.success('Payslip finalized');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to finalize'),
  });

  if (!isOpen) return null;

  const status = payslip?.status;
  const isDraft = status === 'draft';
  const isFinalized = status === 'finalized';
  const isPaid = status === 'paid';
  const isCancelled = status === 'cancelled';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowPay(false);
        setShowCancel(false);
        onClose();
      }}
      title={`Payslip${payslip?.serialNumber ? ` — ${payslip.serialNumber}` : ''}`}
      subtitle={
        payslip
          ? `${
              payslip.staffId?.userId?.name ||
              payslip.staffId?.user?.name ||
              payslip.staffId?.name ||
              'Staff'
            } • ${formatMonth(payslip.month)}`
          : 'Loading…'
      }
      size="xl"
      footer={
        payslip ? (
          <div className="flex flex-wrap gap-2 justify-end w-full">
            <Button
              label="Close"
              handleClick={onClose}
              type="button"
              styleObject={{
                baseColor: 'bg-white border border-gray-300',
                hoverColor: 'hover:bg-gray-50',
                rounded: 'rounded-full',
                size: 'px-8 py-2.5 text-sm min-h-[2.5rem]',
                textColor: 'text-gray-700',
              }}
            />
            {canCancel && !isCancelled && !isPaid && (
              <Button
                label="Cancel Payslip"
                handleClick={() => setShowCancel(true)}
                type="button"
                styleObject={{
                  baseColor: 'bg-red-600',
                  hoverColor: 'hover:bg-red-700',
                  rounded: 'rounded-full',
                  size: 'px-8 py-2.5 text-sm min-h-[2.5rem]',
                  textColor: 'text-white',
                }}
              />
            )}
            {canUpdate && isDraft && (
              <Button
                label="Finalize"
                handleClick={() => finalizeMut.mutate()}
                loading={finalizeMut.isPending}
                type="button"
                styleObject={{
                  baseColor: 'bg-blue-600',
                  hoverColor: 'hover:bg-blue-700',
                  rounded: 'rounded-full',
                  size: 'px-8 py-2.5 text-sm min-h-[2.5rem]',
                  textColor: 'text-white',
                }}
              />
            )}
            {canPay && (isDraft || isFinalized) && (
              <Button
                label="Mark Paid"
                handleClick={() => setShowPay(true)}
                type="button"
                styleObject={{
                  baseColor: 'bg-teal-600',
                  hoverColor: 'hover:bg-teal-700',
                  rounded: 'rounded-full',
                  size: 'px-8 py-2.5 text-sm min-h-[2.5rem]',
                  textColor: 'text-white',
                }}
              />
            )}
          </div>
        ) : null
      }
    >
      {isFetching && !payslip ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !payslip ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No payslip found.</p>
      ) : (
        <PayslipBody
          payslip={payslip}
          showPay={showPay}
          setShowPay={setShowPay}
          showCancel={showCancel}
          setShowCancel={setShowCancel}
        />
      )}
    </Modal>
  );
}

function PayslipBody({ payslip, showPay, setShowPay, showCancel, setShowCancel }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();

  const status = payslip.status;
  const isDraft = status === 'draft';
  const cur = payslip.currency || 'PKR';

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payslips'] });
    queryClient.invalidateQueries({ queryKey: ['payslip-detail', payslip._id] });
    queryClient.invalidateQueries({ queryKey: ['payslip-summary'] });
  };

  const [editing, setEditing] = useState(false);
  const [bonus, setBonus] = useState(payslip.bonus ?? 0);
  const [tax, setTax] = useState(payslip.tax ?? 0);
  const [notes, setNotes] = useState(payslip.notes || '');

  const updateMut = useMutation({
    mutationFn: (payload) =>
      putData({
        url: `/staff-salary/payslip/${payslip._id}`,
        payload,
        token,
      }),
    onSuccess: () => {
      toast.success('Payslip updated');
      setEditing(false);
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to update'),
  });

  const saveEdits = () => {
    const payload = {
      bonus: Number(bonus) || 0,
      tax: Number(tax) || 0,
    };
    if (notes !== payslip.notes) payload.notes = notes;
    updateMut.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
              PAYSLIP_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {status}
          </span>
          {payslip.finalizedAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Finalized {formatDate(payslip.finalizedAt)}
            </span>
          )}
          {payslip.paymentDate && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Paid {formatDate(payslip.paymentDate)}
            </span>
          )}
          {payslip.cancelledAt && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Cancelled {formatDate(payslip.cancelledAt)}
            </span>
          )}
        </div>
        {isDraft && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg border border-teal-200"
          >
            <Edit3 className="w-3 h-3" />
            Edit Bonus/Tax
          </button>
        )}
      </div>

      {payslip.cancelReason && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-sm text-red-700 dark:text-red-400">
          <strong>Reason:</strong> {payslip.cancelReason}
        </div>
      )}

      {/* Earnings vs Deductions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-green-200 rounded-xl bg-green-50/50 overflow-hidden">
          <div className="px-4 py-2 bg-green-100/60 font-semibold text-green-900 text-sm">
            Earnings
          </div>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Basic" value={formatMoney(payslip.basicSalary, cur)} />
              {(payslip.allowances || []).map((a, i) => (
                <Row
                  key={i}
                  label={`${a.name}${a.type === 'percent' ? ` (${a.amount}%)` : ''}`}
                  value={
                    a.type === 'percent'
                      ? formatMoney(
                          ((Number(payslip.basicSalary) || 0) * (Number(a.amount) || 0)) / 100,
                          cur,
                        )
                      : formatMoney(a.amount, cur)
                  }
                />
              ))}
              {editing ? (
                <Row
                  label="Bonus"
                  value={
                    <input
                      type="number"
                      min={0}
                      value={bonus}
                      onChange={(e) => setBonus(e.target.value)}
                      className="w-28 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 text-right"
                    />
                  }
                />
              ) : (
                <Row label="Bonus" value={formatMoney(payslip.bonus, cur)} />
              )}
              {payslip.policyBonus != null && Number(payslip.policyBonus) > 0 && (
                <Row label="Policy Bonus" value={formatMoney(payslip.policyBonus, cur)} />
              )}
              <Row bold label="Gross" value={formatMoney(payslip.gross, cur)} divider />
            </tbody>
          </table>
        </div>

        <div className="border border-red-200 rounded-xl bg-red-50/40 overflow-hidden">
          <div className="px-4 py-2 bg-red-100/50 font-semibold text-red-900 text-sm">
            Deductions
          </div>
          <table className="w-full text-sm">
            <tbody>
              {(payslip.deductions || []).map((d, i) => (
                <Row
                  key={i}
                  label={`${d.name}${d.type === 'percent' ? ` (${d.amount}%)` : ''}`}
                  value={
                    d.type === 'percent'
                      ? formatMoney(
                          ((Number(payslip.basicSalary) || 0) * (Number(d.amount) || 0)) / 100,
                          cur,
                        )
                      : formatMoney(d.amount, cur)
                  }
                />
              ))}
              <Row
                label="Attendance Deduction"
                value={formatMoney(payslip.attendanceDeduction, cur)}
              />
              {editing ? (
                <Row
                  label="Tax"
                  value={
                    <input
                      type="number"
                      min={0}
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="w-28 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 text-right"
                    />
                  }
                />
              ) : (
                <Row label="Tax" value={formatMoney(payslip.tax, cur)} />
              )}
              <Row
                bold
                label="Total Deduction"
                value={formatMoney(
                  (Number(payslip.totalDeduction) || 0) +
                    (Number(payslip.attendanceDeduction) || 0) +
                    (Number(payslip.tax) || 0),
                  cur,
                )}
                divider
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Net banner */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Net Salary
          </div>
          <div className="text-3xl font-bold text-teal-700 dark:text-teal-400 mt-1">
            {formatMoney(payslip.netSalary, cur)}
          </div>
        </div>
        {payslip.paidAmount != null && (
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Paid
            </div>
            <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-1">
              {formatMoney(payslip.paidAmount, cur)}
            </div>
            {payslip.paymentMethod && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                via {PAYMENT_METHOD_LABELS[payslip.paymentMethod] || payslip.paymentMethod}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance snapshot */}
      {payslip.attendance && (
        <div>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
            Attendance Snapshot
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <SnapStat label="Working" value={payslip.attendance.workingDays} />
            <SnapStat label="Present" value={payslip.attendance.presentDays} tone="success" />
            <SnapStat label="Late" value={payslip.attendance.lateDays} />
            <SnapStat label="Half" value={payslip.attendance.halfDays} />
            <SnapStat label="Paid Leave" value={payslip.attendance.paidLeaveDays} />
            <SnapStat
              label="Unpaid Leave"
              value={payslip.attendance.unpaidLeaveDays}
              tone="danger"
            />
            <SnapStat label="Absent" value={payslip.attendance.absentDays} tone="danger" />
            <SnapStat label="Holiday" value={payslip.attendance.holidayDays} />
            <SnapStat label="Days Paid" value={payslip.attendance.daysPaid} tone="success" />
          </div>
        </div>
      )}

      {/* Policy snapshot — frozen rules applied at generation time */}
      {payslip.policySnapshot ? (
        <PolicySnapshotPanel snapshot={payslip.policySnapshot} />
      ) : (
        payslip.attendance && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            No salary policy was active at generation time — pro-rate fallback used (basic ÷ working
            days × unpaid days).
          </div>
        )
      )}

      {/* Edit notes */}
      {editing && (
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={saveEdits}
              disabled={updateMut.isPending}
              className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
            >
              {updateMut.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setBonus(payslip.bonus ?? 0);
                setTax(payslip.tax ?? 0);
                setNotes(payslip.notes || '');
              }}
              className="px-4 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && payslip.notes && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Notes
          </span>
          <p className="mt-1">{payslip.notes}</p>
        </div>
      )}

      {/* Pay form */}
      {showPay && (
        <PayForm payslip={payslip} onClose={() => setShowPay(false)} onDone={invalidate} />
      )}

      {/* Cancel form */}
      {showCancel && (
        <CancelForm payslip={payslip} onClose={() => setShowCancel(false)} onDone={invalidate} />
      )}
    </div>
  );
}

function Row({ label, value, bold, divider }) {
  return (
    <tr className={divider ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
      <td className={`px-4 py-2 ${bold ? 'font-semibold' : ''} text-gray-700 dark:text-gray-300`}>
        {label}
      </td>
      <td className={`px-4 py-2 text-right ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
        {value}
      </td>
    </tr>
  );
}

function PolicySnapshotPanel({ snapshot }) {
  const rows = [
    ['Working days / month', snapshot.workingDaysPerMonth],
    ['Free absences / month', snapshot.freeAbsencesPerMonth],
    [
      'Absent rule',
      snapshot.absentDeductionMode === 'fixed'
        ? `Fixed: ${snapshot.absentDeductionAmount} per absence`
        : `Per-day × ${snapshot.absentDeductionMultiplier}`,
    ],
    ['Free lates / month', snapshot.freeLatesPerMonth],
    ['Late rule', `Every ${snapshot.lateGroupSize} lates = ${snapshot.lateDeductionDays} day(s)`],
    ['Half-day factor', snapshot.halfDayDeductionFactor],
    ['Unpaid leave factor', snapshot.unpaidLeaveDeductionFactor],
    ['Paid leave factor', snapshot.paidLeaveDeductionFactor],
    ['Overtime / hour', snapshot.overtimeBonusPerHour],
    ['Perfect attendance bonus', snapshot.perfectAttendanceBonus],
  ];
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
        Rules Applied
      </h4>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([label, value]) => (
              <tr
                key={label}
                className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{label}</td>
                <td className="px-3 py-1.5 text-right font-medium text-gray-800 dark:text-gray-200">
                  {value ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SnapStat({ label, value, tone }) {
  const map = {
    success: 'border-green-200 bg-green-50 text-green-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
  };
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        map[tone] || 'border-gray-200 bg-gray-50 text-gray-800'
      }`}
    >
      <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value ?? 0}</div>
    </div>
  );
}

function PayForm({ payslip, onClose, onDone }) {
  const { accessToken: token } = useTokenStore();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [paymentReference, setPaymentReference] = useState('');
  // Empty unless the branch keeps several cash/bank accounts — see the picker.
  const [ledgerAccountId, setLedgerAccountId] = useState('');
  const [paidAmount, setPaidAmount] = useState(payslip.netSalary ?? '');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const mut = useMutation({
    mutationFn: (payload) =>
      postData({
        url: `/staff-salary/payslip/${payslip._id}/pay`,
        payload,
        token,
      }),
    onSuccess: () => {
      toast.success('Payslip marked as paid');
      onDone();
      onClose();
    },
    onError: (e) => {
      setErr(e.message || 'Failed to mark paid');
      toast.error(e.message || 'Failed to mark paid');
    },
  });

  const submit = () => {
    setErr('');
    if (!paymentDate) return setErr('Payment date is required');
    if (!paymentMethod) return setErr('Payment method is required');
    if (REFERENCE_REQUIRED_METHODS.includes(paymentMethod) && !paymentReference?.trim())
      return setErr('Reference is required for this payment method');
    const payload = { paymentDate, paymentMethod };
    if (ledgerAccountId) payload.ledgerAccountId = ledgerAccountId;
    if (paymentReference?.trim()) payload.paymentReference = paymentReference.trim();
    if (paidAmount !== '' && !Number.isNaN(Number(paidAmount)))
      payload.paidAmount = Number(paidAmount);
    if (notes?.trim()) payload.notes = notes.trim();
    mut.mutate(payload);
  };

  return (
    <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-bold text-teal-800">Mark as Paid</h4>
      {err && (
        <div className="p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded text-red-700 dark:text-red-400 text-xs">
          {err}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Payment Date</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={inputCls}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>
            Reference{' '}
            {REFERENCE_REQUIRED_METHODS.includes(paymentMethod) && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="TXN-12345"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Paid Amount</label>
          <input
            type="number"
            min={0}
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="col-span-2">
          <CashBankAccountSelect
            method={paymentMethod}
            branchId={payslip.branchId?._id || payslip.branchId}
            value={ledgerAccountId}
            onChange={setLedgerAccountId}
            labelCls={labelCls}
            inputCls={inputCls}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={mut.isPending}
          className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
        >
          {mut.isPending ? 'Saving…' : 'Confirm Paid'}
        </button>
      </div>
    </div>
  );
}

function CancelForm({ payslip, onClose, onDone }) {
  const { accessToken: token } = useTokenStore();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const mut = useMutation({
    mutationFn: (payload) =>
      postData({
        url: `/staff-salary/payslip/${payslip._id}/cancel`,
        payload,
        token,
      }),
    onSuccess: () => {
      toast.success('Payslip cancelled');
      onDone();
      onClose();
    },
    onError: (e) => {
      setErr(e.message || 'Failed to cancel');
      toast.error(e.message || 'Failed to cancel');
    },
  });

  const submit = () => {
    setErr('');
    if (!reason.trim()) return setErr('Reason is required');
    mut.mutate({ reason: reason.trim() });
  };

  return (
    <div className="border border-red-200 bg-red-50/40 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Cancel Payslip</h4>
      {err && (
        <div className="p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded text-red-700 dark:text-red-400 text-xs">
          {err}
        </div>
      )}
      <div>
        <label className={labelCls}>Reason</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Duplicate, error, etc."
          className={inputCls}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Back
        </button>
        <button
          onClick={submit}
          disabled={mut.isPending}
          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
        >
          {mut.isPending ? 'Cancelling…' : 'Confirm Cancel'}
        </button>
      </div>
    </div>
  );
}
