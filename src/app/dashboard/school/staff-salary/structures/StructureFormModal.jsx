'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { COMPONENT_TYPES, toYMD } from '@/constants/staffSalary';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';
const sectionCls = 'text-xs font-bold text-gray-500 uppercase tracking-widest mb-3';

const blankComponent = () => ({
  name: '',
  amount: '',
  type: 'fixed',
});

export default function StructureFormModal({ isOpen, onClose, structure }) {
  const isEdit = !!structure;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch =
    isAdmin || !!user?.role?.actions?.includes('create-all-branch-staff-salary');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [staffId, setStaffId] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [allowances, setAllowances] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setStaffId(structure.staffId?._id || structure.staffId || '');
      setBasicSalary(structure.basicSalary ?? '');
      setCurrency(structure.currency || 'PKR');
      setEffectiveFrom(toYMD(structure.effectiveFrom));
      setEffectiveTo(toYMD(structure.effectiveTo));
      setAllowances(
        (structure.allowances || []).map((a) => ({
          name: a.name || '',
          amount: a.amount ?? '',
          type: a.type || 'fixed',
        })),
      );
      setDeductions(
        (structure.deductions || []).map((d) => ({
          name: d.name || '',
          amount: d.amount ?? '',
          type: d.type || 'fixed',
        })),
      );
      setNotes(structure.notes || '');
    } else {
      setStaffId('');
      setBasicSalary('');
      setCurrency('PKR');
      setEffectiveFrom('');
      setEffectiveTo('');
      setAllowances([]);
      setDeductions([]);
      setNotes('');
    }
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, isEdit, structure]);

  const { data: staffData } = useQuery({
    queryKey: ['staff-dropdown-form', canCreateAllBranch, userBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 500, token };
      if (!canCreateAllBranch && userBranchId) params.branchId = userBranchId;
      return fetchData({ url: '/staff/list', ...params });
    },
    enabled: !!token && isOpen && !isEdit,
    staleTime: 60000,
  });
  const staffList = useMemo(() => staffData?.data || [], [staffData]);

  // Prefill basic salary from the staff record set during staff creation.
  useEffect(() => {
    if (isEdit || !staffId) return;
    const staff = staffList.find((s) => s._id === staffId);
    if (!staff) return;
    setBasicSalary(staff.salary != null ? String(staff.salary) : '');
  }, [staffId, staffList, isEdit]);

  const totals = useMemo(() => {
    const basic = Number(basicSalary) || 0;
    const sumPart = (arr) =>
      arr.reduce((s, c) => {
        const amt = Number(c.amount) || 0;
        if (c.type === 'percent') return s + (basic * amt) / 100;
        return s + amt;
      }, 0);
    const totalAllowance = sumPart(allowances);
    const totalDeduction = sumPart(deductions);
    return {
      gross: basic + totalAllowance,
      net: basic + totalAllowance - totalDeduction,
      totalAllowance,
      totalDeduction,
    };
  }, [basicSalary, allowances, deductions]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? putData({
            url: `/staff-salary/structure/${structure._id}`,
            payload,
            token,
          })
        : postData({ url: '/staff-salary/structure', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isEdit ? 'Structure updated' : 'Structure saved'));
      queryClient.invalidateQueries({ queryKey: ['staff-salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['staff-salary-active'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (!isEdit && !staffId) return 'Staff is required';
    if (basicSalary === '' || Number(basicSalary) < 0) return 'Basic salary must be ≥ 0';
    if (!effectiveFrom) return 'Effective from date is required';
    for (let i = 0; i < allowances.length; i++) {
      const a = allowances[i];
      if (!a.name?.trim()) return `Allowance #${i + 1}: name is required`;
      if (a.amount === '' || Number(a.amount) < 0) return `Allowance #${i + 1}: amount must be ≥ 0`;
      if (a.type === 'percent' && Number(a.amount) > 100)
        return `Allowance #${i + 1}: percent cannot exceed 100`;
    }
    for (let i = 0; i < deductions.length; i++) {
      const d = deductions[i];
      if (!d.name?.trim()) return `Deduction #${i + 1}: name is required`;
      if (d.amount === '' || Number(d.amount) < 0) return `Deduction #${i + 1}: amount must be ≥ 0`;
      if (d.type === 'percent' && Number(d.amount) > 100)
        return `Deduction #${i + 1}: percent cannot exceed 100`;
    }
    return null;
  };

  const handleSubmit = () => {
    setSubmitError('');
    const err = validate();
    if (err) {
      setSubmitError(err);
      toast.error(err);
      return;
    }
    const cleanList = (arr) =>
      arr.map((c) => ({
        name: c.name.trim(),
        amount: Number(c.amount),
        type: c.type,
      }));

    const payload = {
      basicSalary: Number(basicSalary),
      currency,
      effectiveFrom,
      allowances: cleanList(allowances),
      deductions: cleanList(deductions),
    };
    if (effectiveTo) payload.effectiveTo = effectiveTo;
    if (notes?.trim()) payload.notes = notes.trim();
    if (!isEdit) payload.staffId = staffId;

    mutation.mutate(payload);
  };

  const renderComponentRows = (list, setList, kind) => (
    <div className="space-y-2">
      {list.map((c, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start">
          <input
            type="text"
            placeholder="Name (e.g. HRA)"
            value={c.name}
            onChange={(e) =>
              setList((prev) =>
                prev.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
              )
            }
            className={inputCls + ' col-span-5'}
          />
          <input
            type="number"
            min={0}
            placeholder="Amount"
            value={c.amount}
            onChange={(e) =>
              setList((prev) =>
                prev.map((x, idx) => (idx === i ? { ...x, amount: e.target.value } : x)),
              )
            }
            className={inputCls + ' col-span-3'}
          />
          <select
            value={c.type}
            onChange={(e) =>
              setList((prev) =>
                prev.map((x, idx) => (idx === i ? { ...x, type: e.target.value } : x)),
              )
            }
            className={inputCls + ' col-span-3 capitalize'}
          >
            {COMPONENT_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t === 'percent' ? '% of basic' : 'Fixed'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setList((prev) => prev.filter((_, idx) => idx !== i))}
            className="col-span-1 flex items-center justify-center text-red-500 hover:text-red-700 p-2"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setList((prev) => [...prev, blankComponent()])}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg border border-teal-200"
      >
        <Plus className="w-4 h-4" />
        Add {kind}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Salary Structure' : 'New Salary Structure'}
      subtitle={
        isEdit
          ? 'Update the salary breakdown and effective dates'
          : 'Define basic salary, allowances, and deductions for a staff member'
      }
      size="xl"
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
            label={isEdit ? 'Save Changes' : 'Create Structure'}
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
      <div className="space-y-6">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div>
          <h3 className={sectionCls}>Basics</h3>
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
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
                    const label = s.user?.name || s.userId?.name || s.name || 'Staff';
                    const ref = s.serialNumber || s.employeeId;
                    return (
                      <option key={s._id} value={s._id}>
                        {label} {ref ? `(${ref})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div>
              <label className={labelCls}>
                Basic Salary<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                placeholder="80000"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Effective From<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Effective To</label>
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={sectionCls + ' mb-0'}>Allowances</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {allowances.length} item{allowances.length === 1 ? '' : 's'}
            </span>
          </div>
          {renderComponentRows(allowances, setAllowances, 'Allowance')}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={sectionCls + ' mb-0'}>Deductions</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {deductions.length} item{deductions.length === 1 ? '' : 's'}
            </span>
          </div>
          {renderComponentRows(deductions, setDeductions, 'Deduction')}
        </div>

        <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl p-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Total Allowances
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
              + {totals.totalAllowance.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Total Deductions
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
              − {totals.totalDeduction.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Net (estimate)
            </div>
            <div className="text-lg font-bold text-teal-700 dark:text-teal-400 mt-1">
              {totals.net.toLocaleString()} {currency}
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
