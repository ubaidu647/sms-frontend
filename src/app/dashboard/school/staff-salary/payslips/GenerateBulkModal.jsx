'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { STAFF_TYPES, currentMonth, previousMonth } from '@/constants/staffSalary';
import { CheckCircle2 } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function GenerateBulkModal({ isOpen, onClose }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const canAllBranch = isAdmin || !!user?.role?.actions?.includes('generate-all-branch-payslip');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [branchId, setBranchId] = useState('');
  const [month, setMonth] = useState(previousMonth());
  const [staffType, setStaffType] = useState('');
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setBranchId(canAllBranch ? '' : userBranchId);
    setMonth(previousMonth());
    setStaffType('');
    setResult(null);
    setSubmitError('');
  }, [isOpen, canAllBranch, userBranchId]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOpen && canAllBranch,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) =>
      postData({
        url: '/staff-salary/payslip/generate-bulk',
        payload,
        token,
      }),
    onSuccess: (res) => {
      const data = res?.data ?? res;
      setResult(data);
      toast.success(
        `Bulk run complete — created ${data?.created || 0}, skipped ${data?.skipped || 0}`,
      );
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      queryClient.invalidateQueries({ queryKey: ['payslip-summary'] });
    },
    onError: (err) => {
      const msg = err.message || 'Bulk generation failed';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    setSubmitError('');
    if (!branchId) {
      setSubmitError('Branch is required');
      return;
    }
    if (!month) {
      setSubmitError('Month is required');
      return;
    }
    const payload = { branchId, month };
    if (staffType) payload.staffType = staffType;
    mutation.mutate(payload);
  };

  const created = useMemo(
    () => (result?.results || []).filter((r) => r.status === 'created'),
    [result],
  );
  const skipped = useMemo(
    () => (result?.results || []).filter((r) => r.status === 'skipped'),
    [result],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Run Payroll (Bulk)"
      subtitle="Generate payslips for an entire branch in one go"
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label={result ? 'Close' : 'Cancel'}
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
          {!result && (
            <Button
              label="Run"
              styleObject={{
                baseColor: 'bg-teal-600',
                hoverColor: 'hover:bg-teal-700',
                rounded: 'rounded-full',
                size: 'px-10 py-3 text-md min-h-[3rem]',
                textColor: 'text-white',
              }}
              loading={mutation.isPending}
              handleClick={handleSubmit}
            />
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        {!result ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {canAllBranch ? (
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Branch<span className="text-red-500">*</span>
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
            ) : (
              <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                Branch: <strong>your branch</strong>
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
              <label className={labelCls}>Staff Type</label>
              <select
                value={staffType}
                onChange={(e) => setStaffType(e.target.value)}
                className={inputCls + ' capitalize'}
              >
                <option value="">All</option>
                {STAFF_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Total" value={result.total ?? 0} />
              <Stat label="Created" value={result.created ?? 0} tone="success" />
              <Stat label="Skipped" value={result.skipped ?? 0} tone="warning" />
            </div>

            {skipped.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Skipped ({skipped.length})
                </h4>
                <div className="border border-amber-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-amber-50 text-amber-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Staff ID</th>
                        <th className="px-3 py-2 text-left font-semibold">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skipped.map((r, i) => (
                        <tr key={i} className="border-t border-amber-100">
                          <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                            {r.staffId}
                          </td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {r.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {created.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Created ({created.length})
                </h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Generated {created.length} draft payslips. Use the Payslips list to review and
                  finalize.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone }) {
  const map = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        map[tone] || 'bg-gray-50 border-gray-200 text-gray-800'
      }`}
    >
      <div className="text-xs uppercase tracking-widest opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
