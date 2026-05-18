'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function StudentPickerModal({ isOpen, onClose }) {
  const router = useRouter();
  const { accessToken: token } = useTokenStore();

  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentLabel, setStudentLabel] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setStudentId('');
      setStudentLabel('');
      setShowResults(false);
    }
  }, [isOpen]);

  const { data: studentData } = useQuery({
    queryKey: ['student-search-consolidated', search],
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

  const handleOpen = () => {
    if (!studentId) return;
    router.push(`/dashboard/school/fees/vouchers/consolidated/${studentId}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consolidated Arrears Slip"
      subtitle="Pick a student to view their outstanding vouchers as one slip"
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
            label="Open Slip"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            handleClick={handleOpen}
            disabled={!studentId}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>
            Student<span className="text-red-500">*</span>
          </label>
          {studentId ? (
            <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-teal-50 dark:bg-teal-950/40">
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {studentLabel}
              </span>
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
                <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {students.map((s) => (
                    <li
                      key={s._id}
                      className="px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer text-sm"
                      onClick={() => {
                        setStudentId(s._id);
                        setStudentLabel(
                          `${s.user?.name || s.name || 'Student'} — ${
                            s.admissionNumber || ''
                          }`,
                        );
                        setShowResults(false);
                      }}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {s.user?.name || s.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {s.admissionNumber} · Roll {s.rollNumber}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
