'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { currentMonth } from '@/constants/fee';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function GenerateStudentModal({ isOpen, onClose }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentLabel, setStudentLabel] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [dueDate, setDueDate] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setStudentId('');
      setStudentLabel('');
      setMonth(currentMonth());
      setDueDate('');
      setSubmitError('');
      setShowResults(false);
    }
  }, [isOpen]);

  const { data: studentData } = useQuery({
    queryKey: ['student-search-gen', search],
    queryFn: () =>
      fetchData({
        url: '/student/list',
        page: 1,
        limit: 10,
        token,
        search,
        isActive: true,
      }),
    enabled: !!token && isOpen && search.length >= 2,
    staleTime: 10000,
  });
  const students = studentData?.data || [];

  const mutation = useMutation({
    mutationFn: (payload) =>
      postData({ url: '/fee/voucher/generate-student', payload, token }),
    onSuccess: (res) => {
      if (res?.data?.skipped) {
        toast(res?.message || 'Voucher already exists for this month', { icon: '⏭️' });
      } else {
        toast.success(res?.message || 'Voucher generated');
      }
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      onClose();
    },
    onError: (err) => {
      const msg = err.message || 'Failed to generate voucher';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    setSubmitError('');
    if (!studentId) return setSubmitError('Pick a student');
    if (!month?.match(/^\d{4}-\d{2}$/)) return setSubmitError('month must be YYYY-MM');
    const payload = { studentId, month };
    if (dueDate) payload.dueDate = dueDate;
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Voucher (Single Student)"
      subtitle="Use for new admissions mid-month or one-off vouchers"
      size="md"
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
            handleClick={handleSubmit}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <div>
          <label className={labelCls}>
            Student<span className="text-red-500">*</span>
          </label>
          {studentId ? (
            <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-teal-50">
              <span className="text-sm text-gray-900">{studentLabel}</span>
              <button
                type="button"
                onClick={() => {
                  setStudentId('');
                  setStudentLabel('');
                  setShowResults(false);
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowResults(true);
                }}
                placeholder="Type name or admission #..."
                className={inputCls}
              />
              {showResults && search.length >= 2 && students.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {students.map((s) => (
                    <li
                      key={s._id}
                      className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-sm"
                      onClick={() => {
                        setStudentId(s._id);
                        setStudentLabel(
                          `${s.user?.name || s.name || 'Student'} — ${s.admissionNumber || ''}`,
                        );
                        setShowResults(false);
                      }}
                    >
                      <div className="font-medium text-gray-900">{s.user?.name || s.name}</div>
                      <div className="text-xs text-gray-500">
                        {s.admissionNumber} · Roll {s.rollNumber}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
        </div>
      </div>
    </Modal>
  );
}
