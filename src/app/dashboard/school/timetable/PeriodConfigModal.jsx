'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { Plus, Trash2 } from 'lucide-react';
import {
  DAYS,
  DAY_LABELS,
  PERIOD_TYPES,
  PERIOD_TYPE_COLORS,
  addMinutes,
  isHHmm,
} from '@/constants/timetable';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const smallInputCls =
  'w-full px-2 py-1.5 border border-gray-200 rounded-md outline-none focus:border-teal-500 text-sm text-gray-900 bg-white';

const blankPeriod = (n, prevEnd) => ({
  number: n,
  name: `Period ${n}`,
  startTime: prevEnd || '08:00',
  endTime: addMinutes(prevEnd || '08:00', 45),
  type: 'lesson',
});

export default function PeriodConfigModal({ isOpen, onClose, onSuccess, config }) {
  const isEditing = !!config;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [workingDays, setWorkingDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [periods, setPeriods] = useState([blankPeriod(1)]);
  const [branchId, setBranchId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch =
    isAdmin || !!user?.role?.actions?.includes('create-all-branch-timetable');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canCreateAllBranch && isOpen && !isEditing,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && config) {
      setName(config.name || '');
      setIsDefault(!!config.isDefault);
      setWorkingDays(config.workingDays || []);
      setPeriods(
        (config.periods || []).map((p) => ({
          number: p.number,
          name: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          type: p.type,
        })),
      );
      setBranchId(config.branchId || '');
    } else {
      setName('Standard Schedule');
      setIsDefault(false);
      setWorkingDays(['mon', 'tue', 'wed', 'thu', 'fri']);
      setPeriods([blankPeriod(1)]);
      setBranchId(canCreateAllBranch ? '' : userBranchId);
    }
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, isEditing, config, canCreateAllBranch, userBranchId]);

  const toggleDay = (d) => {
    setWorkingDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const addPeriod = () => {
    const last = periods[periods.length - 1];
    const num = (last?.number || 0) + 1;
    setPeriods([...periods, blankPeriod(num, last?.endTime)]);
  };

  const removePeriod = (idx) => {
    setPeriods((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePeriod = (idx, patch) => {
    setPeriods((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!workingDays.length) return 'Pick at least one working day';
    if (!periods.length) return 'Add at least one period';
    const seen = new Set();
    for (let i = 0; i < periods.length; i++) {
      const p = periods[i];
      if (!p.name) return `periods[${i}]: name is required`;
      if (!isHHmm(p.startTime)) return `periods[${i}]: startTime must be HH:mm`;
      if (!isHHmm(p.endTime)) return `periods[${i}]: endTime must be HH:mm`;
      if (p.endTime <= p.startTime)
        return `periods[${i}]: endTime must be after startTime`;
      if (seen.has(p.number)) return `periods[${i}]: duplicate number ${p.number}`;
      seen.add(p.number);
    }
    if (canCreateAllBranch && !branchId && !isEditing) return 'Branch is required';
    return null;
  };

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEditing
        ? putData({ url: `/timetable/period-config/${config._id}`, payload, token })
        : postData({ url: '/timetable/period-config', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isEditing ? 'Config updated' : 'Config created'));
      queryClient.invalidateQueries({ queryKey: ['period-configs'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onSuccess?.(res?.data);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save config';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    setSubmitError('');
    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }
    const payload = {
      name: name.trim(),
      isDefault,
      workingDays,
      periods: periods.map((p) => ({
        number: Number(p.number),
        name: p.name.trim(),
        startTime: p.startTime,
        endTime: p.endTime,
        type: p.type,
      })),
    };
    if (canCreateAllBranch && branchId && !isEditing) payload.branchId = branchId;
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Period Config' : 'Add Period Config'}
      subtitle="Daily structure — periods, times, working days"
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
            label={isEditing ? 'Save Changes' : 'Create Config'}
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
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Basic Info
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Standard Schedule"
                className={inputCls}
              />
            </div>
            {!isEditing && canCreateAllBranch && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select branch...</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 mt-2 col-span-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 accent-teal-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Set as branch default — used by all section editors
              </span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Working Days
          </h3>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = workingDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    on
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {DAY_LABELS[d]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Periods
            </h3>
            <button
              type="button"
              onClick={addPeriod}
              className="flex items-center gap-1 text-sm text-teal-700 dark:text-teal-400 hover:text-teal-800"
            >
              <Plus className="w-4 h-4" /> Add Period
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="text-left py-2 pr-2 font-semibold w-16">#</th>
                  <th className="text-left py-2 pr-2 font-semibold">Name</th>
                  <th className="text-left py-2 pr-2 font-semibold w-28">Start</th>
                  <th className="text-left py-2 pr-2 font-semibold w-28">End</th>
                  <th className="text-left py-2 pr-2 font-semibold w-32">Type</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {periods.map((p, idx) => (
                  <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min="1"
                        value={p.number}
                        onChange={(e) =>
                          updatePeriod(idx, { number: Number(e.target.value) })
                        }
                        className={smallInputCls}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updatePeriod(idx, { name: e.target.value })}
                        className={smallInputCls}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="time"
                        value={p.startTime}
                        onChange={(e) =>
                          updatePeriod(idx, { startTime: e.target.value })
                        }
                        className={smallInputCls}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="time"
                        value={p.endTime}
                        onChange={(e) => updatePeriod(idx, { endTime: e.target.value })}
                        className={smallInputCls}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={p.type}
                        onChange={(e) => updatePeriod(idx, { type: e.target.value })}
                        className={`${smallInputCls} capitalize ${
                          PERIOD_TYPE_COLORS[p.type] || ''
                        }`}
                      >
                        {PERIOD_TYPES.map((t) => (
                          <option key={t} value={t} className="capitalize">
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <button
                        type="button"
                        onClick={() => removePeriod(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Periods must have unique numbers and end after start.
          </p>
        </div>
      </div>
    </Modal>
  );
}
