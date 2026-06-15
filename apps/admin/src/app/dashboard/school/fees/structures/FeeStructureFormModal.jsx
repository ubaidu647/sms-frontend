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
import { FEE_FREQUENCIES, MONTH_OPTIONS, currentAcademicYear } from '@/constants/fee';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

const blankComponent = () => ({
  name: '',
  amount: 0,
  frequency: 'monthly',
  billingMonth: '',
  appliesDiscount: true,
  isOptional: false,
});

export default function FeeStructureFormModal({ isOpen, onClose, structure }) {
  const isEdit = !!structure;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch = isAdmin || !!user?.role?.actions?.includes('create-all-branch-fee');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [classId, setClassId] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [name, setName] = useState('');
  const [defaultDueDay, setDefaultDueDay] = useState(10);
  const [lateFeePerDay, setLateFeePerDay] = useState(0);
  const [components, setComponents] = useState([blankComponent()]);
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setClassId(structure.classId?._id || structure.classId || '');
      setAcademicYear(structure.academicYear || currentAcademicYear());
      setName(structure.name || '');
      setDefaultDueDay(structure.defaultDueDay ?? 10);
      setLateFeePerDay(structure.lateFeePerDay ?? 0);
      setComponents(
        (structure.components || []).map((c) => ({
          name: c.name || '',
          amount: c.amount ?? 0,
          frequency: c.frequency || 'monthly',
          billingMonth: c.billingMonth ?? '',
          appliesDiscount: c.appliesDiscount !== false,
          isOptional: !!c.isOptional,
        })),
      );
    } else {
      setClassId('');
      setAcademicYear(currentAcademicYear());
      setName('');
      setDefaultDueDay(10);
      setLateFeePerDay(0);
      setComponents([blankComponent()]);
    }
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, isEdit, structure]);

  const { data: classData } = useQuery({
    queryKey: ['classes-fee-structure', canCreateAllBranch, userBranchId, academicYear],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (academicYear) params.academicYear = academicYear;
      if (!canCreateAllBranch && userBranchId) params.branchId = userBranchId;
      return fetchData({ url: '/class/list', ...params });
    },
    enabled: !!token && isOpen && !isEdit,
    staleTime: 30000,
  });
  const classes = classData?.data || [];

  const totalMonthly = useMemo(
    () =>
      components
        .filter((c) => c.frequency === 'monthly' && !c.isOptional)
        .reduce((s, c) => s + (Number(c.amount) || 0), 0),
    [components],
  );

  const updateComponent = (i, patch) => {
    setComponents((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const removeComponent = (i) => {
    setComponents((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addComponent = () => setComponents((prev) => [...prev, blankComponent()]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? putData({ url: `/fee/structure/${structure._id}`, payload, token })
        : postData({ url: '/fee/structure', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isEdit ? 'Fee structure updated' : 'Fee structure created'));
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save fee structure';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (!isEdit && !classId) return 'Class is required';
    if (!academicYear?.match(/^\d{4}-\d{4}$/)) return 'Academic year must be YYYY-YYYY';
    if (!name?.trim()) return 'Name is required';
    if (!components.length) return 'At least one component is required';
    const seen = new Set();
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      if (!c.name?.trim()) return `components[${i}]: name is required`;
      const lower = c.name.trim().toLowerCase();
      if (seen.has(lower)) return `components[${i}]: duplicate name "${c.name}"`;
      seen.add(lower);
      if (c.amount === '' || Number(c.amount) < 0) return `components[${i}]: amount must be ≥ 0`;
      if (!FEE_FREQUENCIES.includes(c.frequency)) return `components[${i}]: frequency invalid`;
      if (
        (c.frequency === 'annual' || c.frequency === 'quarterly') &&
        (!c.billingMonth || c.billingMonth < 1 || c.billingMonth > 12)
      )
        return `components[${i}]: billingMonth is required for ${c.frequency} fees`;
    }
    if (defaultDueDay < 1 || defaultDueDay > 31) return 'defaultDueDay must be 1-31';
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
    const payload = {
      academicYear,
      name: name.trim(),
      defaultDueDay: Number(defaultDueDay),
      lateFeePerDay: Number(lateFeePerDay) || 0,
      components: components.map((c) => {
        const out = {
          name: c.name.trim(),
          amount: Number(c.amount) || 0,
          frequency: c.frequency,
          appliesDiscount: !!c.appliesDiscount,
          isOptional: !!c.isOptional,
        };
        if (c.frequency === 'annual' || c.frequency === 'quarterly') {
          out.billingMonth = Number(c.billingMonth);
        }
        return out;
      }),
    };
    if (!isEdit) payload.classId = classId;
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Fee Structure' : 'New Fee Structure'}
      subtitle={
        isEdit
          ? 'Update components, due day, and late-fee settings'
          : 'Define monthly, one-time, annual and quarterly fee components for a class'
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEdit && (
            <div>
              <label className={labelCls}>
                Class<span className="text-red-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className={inputCls}
              >
                <option value="">Select class...</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.grade ? `(Gr ${c.grade})` : ''} — {c.academicYear}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>
              Academic Year<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className={inputCls}
              disabled={isEdit}
            />
          </div>
          <div className={isEdit ? 'col-span-2' : ''}>
            <label className={labelCls}>
              Structure Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grade 5 — 2025-26 Fee Structure"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Default Due Day (1-31)</label>
            <input
              type="number"
              min={1}
              max={31}
              value={defaultDueDay}
              onChange={(e) => setDefaultDueDay(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Late Fee / Day</label>
            <input
              type="number"
              min={0}
              value={lateFeePerDay}
              onChange={(e) => setLateFeePerDay(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Components
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Monthly total:{' '}
              <strong className="text-teal-700 dark:text-teal-400">
                ₨ {totalMonthly.toLocaleString()}
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold">Frequency</th>
                  <th className="px-3 py-2 text-left font-semibold">Billing Month</th>
                  <th className="px-3 py-2 text-center font-semibold">Discount</th>
                  <th className="px-3 py-2 text-center font-semibold">Optional</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {components.map((c, i) => {
                  const needsMonth = c.frequency === 'annual' || c.frequency === 'quarterly';
                  return (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateComponent(i, { name: e.target.value })}
                          placeholder="Tuition Fee"
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2 w-32">
                        <input
                          type="number"
                          min={0}
                          value={c.amount}
                          onChange={(e) => updateComponent(i, { amount: e.target.value })}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2 w-36">
                        <select
                          value={c.frequency}
                          onChange={(e) =>
                            updateComponent(i, {
                              frequency: e.target.value,
                              billingMonth:
                                e.target.value === 'annual' || e.target.value === 'quarterly'
                                  ? c.billingMonth
                                  : '',
                            })
                          }
                          className={inputCls}
                        >
                          {FEE_FREQUENCIES.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 w-40">
                        <select
                          value={c.billingMonth || ''}
                          onChange={(e) =>
                            updateComponent(i, {
                              billingMonth: e.target.value ? Number(e.target.value) : '',
                            })
                          }
                          disabled={!needsMonth}
                          className={`${inputCls} ${!needsMonth ? 'bg-gray-50 text-gray-400' : ''}`}
                        >
                          <option value="">—</option>
                          {MONTH_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={c.appliesDiscount}
                          onChange={(e) =>
                            updateComponent(i, { appliesDiscount: e.target.checked })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={c.isOptional}
                          onChange={(e) => updateComponent(i, { isOptional: e.target.checked })}
                        />
                      </td>
                      <td className="px-3 py-2 w-10">
                        <button
                          type="button"
                          onClick={() => removeComponent(i)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addComponent}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg border border-teal-200"
          >
            <Plus className="w-4 h-4" />
            Add Component
          </button>
        </div>
      </div>
    </Modal>
  );
}
