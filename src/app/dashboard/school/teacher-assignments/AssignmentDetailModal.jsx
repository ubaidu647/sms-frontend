'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { Star } from 'lucide-react';

function Row({ label, value, className = '' }) {
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-xs text-gray-800 dark:text-gray-200 font-medium break-words leading-tight">
        {value || <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

function Section({ title, children, cols = 4 }) {
  const gridCols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[cols];
  return (
    <div>
      <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
        {title}
      </h3>
      <div className={`grid ${gridCols} gap-x-4 gap-y-2`}>{children}</div>
    </div>
  );
}

function Badge({ label, color, icon: Icon }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    teal: 'bg-teal-100 text-teal-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-800',
    amber: 'bg-amber-100 text-amber-800',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${colors[color] || colors.gray}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

function fmt(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AssignmentDetailModal({ isOpen, onClose, assignmentId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['assignment-detail', assignmentId],
    queryFn: () => fetchData({ url: `/teaching-assignment/${assignmentId}`, token }),
    enabled: !!token && !!assignmentId && isOpen,
    staleTime: 30000,
  });

  const a = data?.data;

  const teacherName = a?.staff?.user?.name || '';
  const initials =
    teacherName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || '?';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assignment Details"
      subtitle={a ? a.serialNumber : 'Loading…'}
      size="lg"
    >
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && a && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100">
            <div className="relative flex-shrink-0">
              {a.staff?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.staff.photo}
                  alt={teacherName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-teal-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 dark:text-teal-400 font-bold text-xl flex items-center justify-center border-4 border-white shadow-md ring-2 ring-teal-200">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {teacherName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {a.subject?.name} {a.subject?.code ? `(${a.subject.code})` : ''}
                {' · '}
                {a.class?.name}
                {a.section?.name ? ` / ${a.section.name}` : ''}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {a.staff?.designation} · {a.academicYear}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge
                  label={a.isActive ? 'Active' : 'Inactive'}
                  color={a.isActive ? 'green' : 'gray'}
                />
                <Badge
                  label={a.role}
                  color={
                    a.role === 'teacher' ? 'teal' : a.role === 'co-teacher' ? 'blue' : 'yellow'
                  }
                />
                {a.isPrimary && <Badge label="Primary" color="amber" icon={Star} />}
              </div>
            </div>
          </div>

          <Section title="Assignment">
            <Row label="Role" value={a.role} />
            <Row label="Primary" value={a.isPrimary ? 'Yes' : 'No'} />
            <Row label="Academic Year" value={a.academicYear} />
            <Row label="Status" value={a.status} />
            <Row label="Start Date" value={fmt(a.startDate)} />
            <Row label="End Date" value={fmt(a.endDate)} />
            <Row label="Branch" value={a.branch?.name} />
            <Row label="Serial Number" value={a.serialNumber} />
          </Section>

          <Section title="Teacher" cols={3}>
            <Row label="Name" value={teacherName} />
            <Row label="Email" value={a.staff?.user?.email} />
            <Row label="Designation" value={a.staff?.designation} />
            <Row label="Staff Serial" value={a.staff?.serialNumber} />
          </Section>

          <Section title="Subject" cols={3}>
            <Row label="Name" value={a.subject?.name} />
            <Row label="Code" value={a.subject?.code} />
            <Row label="Type" value={a.subject?.subjectType} />
            <Row label="Total Marks" value={a.subject?.totalMarks} />
          </Section>

          <Section title="Class & Section" cols={3}>
            <Row label="Class" value={a.class?.name} />
            <Row label="Grade" value={a.class?.grade} />
            <Row label="Class Type" value={a.class?.classType} />
            <Row label="Medium" value={a.class?.medium} />
            <Row label="Section" value={a.section?.name} />
            <Row
              label="Strength"
              value={a.section ? `${a.section.currentStrength}/${a.section.capacity}` : null}
            />
          </Section>

          {a.notes && (
            <Section title="Notes" cols={2}>
              <Row label="Notes" value={a.notes} className="sm:col-span-2" />
            </Section>
          )}

          <Section title="Record">
            <Row label="Created" value={fmt(a.createdAt)} />
            <Row label="Updated" value={fmt(a.updatedAt)} />
          </Section>
        </div>
      )}
    </Modal>
  );
}
