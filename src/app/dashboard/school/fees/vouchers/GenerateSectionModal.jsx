'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { currentAcademicYear, currentMonth } from '@/constants/fee';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function GenerateSectionModal({ isOpen, onClose }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || user?.role?.actions?.includes('generate-all-branch-voucher');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [dueDate, setDueDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setAcademicYear(currentAcademicYear());
      setClassId('');
      setSectionId('');
      setMonth(currentMonth());
      setDueDate('');
      setBranchId('');
      setResult(null);
      setSubmitError('');
    }
  }, [isOpen]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOpen && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: classData } = useQuery({
    queryKey: ['classes-gen', effectiveBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        academicYear,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token && isOpen && !!academicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['sections-gen', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) =>
      postData({ url: '/fee/voucher/generate-section', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Vouchers generated');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      setResult(res?.data);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to generate vouchers';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    setSubmitError('');
    if (!sectionId) {
      setSubmitError('Section is required');
      return;
    }
    if (!month?.match(/^\d{4}-\d{2}$/)) {
      setSubmitError('month must be YYYY-MM');
      return;
    }
    const payload = { sectionId, month };
    if (dueDate) payload.dueDate = dueDate;
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Vouchers (Section)"
      subtitle="Bulk-create monthly vouchers for every active student in a section"
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
              label="Generate"
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
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {submitError}
        </div>
      )}

      {!result ? (
        <div className="grid grid-cols-2 gap-4">
          {isOrgLevel && (
            <div>
              <label className={labelCls}>Branch</label>
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setClassId('');
                  setSectionId('');
                }}
                className={inputCls}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              Class<span className="text-red-500">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId('');
              }}
              className={inputCls}
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.grade ? `(Gr ${c.grade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Section<span className="text-red-500">*</span>
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!classId}
              className={inputCls}
            >
              <option value="">{classId ? 'Select section...' : 'Pick class first'}</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Month (YYYY-MM)<span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Due Date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Defaults to structure&apos;s due day.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Total" value={result.total} tone="bg-gray-100 text-gray-800" />
            <Stat label="Created" value={result.createdCount} tone="bg-green-100 text-green-800" />
            <Stat label="Skipped" value={result.skippedCount} tone="bg-amber-100 text-amber-800" />
          </div>
          {result.skipped?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Skipped</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y">
                {result.skipped.map((s, i) => (
                  <li key={i} className="px-3 py-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{s.studentId}</span>
                    <span className="text-gray-700 dark:text-gray-300">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`rounded-lg ${tone} p-4`}>
      <div className="text-2xl font-bold">{value ?? 0}</div>
      <div className="text-xs uppercase tracking-wide">{label}</div>
    </div>
  );
}
