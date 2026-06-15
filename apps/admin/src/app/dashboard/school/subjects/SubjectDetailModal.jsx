'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
        {value ?? <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

function InfoSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100 dark:border-gray-800">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  );
}

function Badge({ label, color }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    teal: 'bg-teal-100 text-teal-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-700',
  };
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}
    >
      {label}
    </span>
  );
}

function fmt(d) {
  return d
    ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

export default function SubjectDetailModal({ isOpen, onClose, subjectId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['subject-detail', subjectId],
    queryFn: () => fetchData({ url: `/subject/${subjectId}`, token }),
    enabled: !!token && !!subjectId && isOpen,
    staleTime: 30000,
  });
  const sub = data?.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subject Details"
      subtitle={sub ? `${sub.name} · ${sub.code} · ${sub.academicYear}` : 'Loading…'}
      size="lg"
    >
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && sub && (
        <div className="space-y-6">
          {/* Status banner */}
          <div className="flex items-center flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Badge
              label={sub.isActive ? 'Active' : 'Inactive'}
              color={sub.isActive ? 'green' : 'red'}
            />
            <Badge label={cap(sub.subjectType)} color="purple" />
            <Badge label={cap(sub.category)} color="blue" />
            {sub.class && (
              <Badge
                label={`${sub.class.name}${sub.class.grade ? ` (Gr ${sub.class.grade})` : ''}`}
                color="teal"
              />
            )}
            {sub.branch && <Badge label={sub.branch.name} color="gray" />}
          </div>

          <InfoSection title="Subject Info">
            <Row label="Name" value={sub.name} />
            <Row label="Code" value={sub.code} />
            <Row label="Serial No." value={sub.serialNumber} />
            <Row label="Type" value={cap(sub.subjectType)} />
            <Row label="Category" value={cap(sub.category)} />
            <Row label="Academic Year" value={sub.academicYear} />
            <Row label="Credit Hours" value={sub.creditHours ?? '—'} />
            <Row label="Branch" value={sub.branch?.name} />
          </InfoSection>

          <InfoSection title="Marks">
            <Row label="Total Marks" value={sub.totalMarks} />
            <Row label="Passing Marks" value={sub.passingMarks} />
            <Row label="Theory Marks" value={sub.theoryMarks ?? '—'} />
            <Row label="Practical Marks" value={sub.practicalMarks ?? '—'} />
          </InfoSection>

          <InfoSection title="Class & Teacher">
            <Row label="Class" value={sub.class?.name} />
            <Row label="Grade" value={sub.class?.grade} />
            <Row label="Class Type" value={cap(sub.class?.classType)} />
            <Row label="Medium" value={cap(sub.class?.medium)} />
            {sub.teacherInfo && (
              <Row
                label="Default Teacher"
                value={`${sub.teacherInfo.user?.name} (${sub.teacherInfo.designation})`}
              />
            )}
            <Row label="Created" value={fmt(sub.createdAt)} />
          </InfoSection>
        </div>
      )}
    </Modal>
  );
}
