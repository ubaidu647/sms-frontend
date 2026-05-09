'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import {
  currentMonth,
  formatMoney,
  previousMonth,
} from '@/constants/staffSalary';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function GeneratePayslipModal({ isOpen, onClose }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const canAllBranch =
    isAdmin ||
    !!user?.role?.actions?.includes('generate-all-branch-payslip');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [staffId, setStaffId] = useState('');
  const [month, setMonth] = useState(previousMonth());
  const [bonus, setBonus] = useState('');
  const [tax, setTax] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStaffId('');
    setMonth(previousMonth());
    setBonus('');
    setTax('');
    setNotes('');
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen]);

  const { data: staffData } = useQuery({
    queryKey: ['staff-dropdown-form', canAllBranch, userBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 500, token };
      if (!canAllBranch && userBranchId) params.branchId = userBranchId;
      return fetchData({ url: '/staff/list', ...params });
    },
    enabled: !!token && isOpen,
    staleTime: 60000,
  });
  const staffList = staffData?.data || [];

  const { data: activeStruct, isFetching: structLoading } = useQuery({
    queryKey: ['staff-salary-active', staffId],
    queryFn: () =>
      fetchData({
        url: `/staff-salary/structure/staff/${staffId}`,
        token,
      }),
    enabled: !!token && isOpen && !!staffId,
    staleTime: 30000,
  });
  const struct = activeStruct?.data ?? activeStruct;

  const mutation = useMutation({
    mutationFn: (payload) =>
      postData({ url: '/staff-salary/payslip/generate', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Payslip generated');
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      queryClient.invalidateQueries({ queryKey: ['payslip-summary'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to generate payslip';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    setSubmitError('');
    if (!staffId) {
      setSubmitError('Staff is required');
      return;
    }
    if (!month) {
      setSubmitError('Month is required');
      return;
    }
    const payload = { staffId, month };
    if (bonus !== '' && !Number.isNaN(Number(bonus)))
      payload.bonus = Number(bonus);
    if (tax !== '' && !Number.isNaN(Number(tax))) payload.tax = Number(tax);
    if (notes?.trim()) payload.notes = notes.trim();
    mutation.mutate(payload);
  };

  const noStruct = !!staffId && !structLoading && !struct;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Payslip"
      subtitle="Create a draft payslip for a staff member for a specific month"
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label="Generate"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={mutation.isPending}
            success={successState}
            handleClick={handleSubmit}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>
              Staff<span className="text-red-500">*</span>
            </label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select staff...</option>
              {staffList.map((s) => {
                const label =
                  s.user?.name ||
                  s.userId?.name ||
                  s.name ||
                  'Staff';
                const ref = s.serialNumber || s.employeeId;
                return (
                  <option key={s._id} value={s._id}>
                    {label} {ref ? `(${ref})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {staffId && (
            <div className="col-span-2">
              {structLoading ? (
                <div className="text-xs text-gray-500 dark:text-gray-400">Loading structure…</div>
              ) : noStruct ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  No active salary structure for this staff. Define one in
                  Salary Structures before generating a payslip.
                </div>
              ) : struct ? (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex flex-wrap gap-x-6 gap-y-1">
                  <span>
                    Basic:{' '}
                    <strong>
                      {formatMoney(struct.basicSalary, struct.currency)}
                    </strong>
                  </span>
                  <span>
                    Allowances:{' '}
                    <strong>{(struct.allowances || []).length}</strong>
                  </span>
                  <span>
                    Deductions:{' '}
                    <strong>{(struct.deductions || []).length}</strong>
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <label className={labelCls}>
              Month<span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              max={currentMonth()}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Bonus (optional)</label>
            <input
              type="number"
              min={0}
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Tax (optional)</label>
            <input
              type="number"
              min={0}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className={inputCls}
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
      </div>
    </Modal>
  );
}
