'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value ?? <span className="text-gray-300">—</span>}</span>
    </div>
  );
}

function InfoSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  );
}

function Badge({ label, color }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    red:   'bg-red-100 text-red-800',
    teal:  'bg-teal-100 text-teal-800',
    blue:  'bg-blue-100 text-blue-800',
    gray:  'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : null;
}

export default function ClassDetailModal({ isOpen, onClose, classId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['class-detail', classId],
    queryFn: () => fetchData({ url: `/class/${classId}`, token }),
    enabled: !!token && !!classId && isOpen,
    staleTime: 30000,
  });
  const cls = data?.data;

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Class Details"
      subtitle={cls ? `${cls.name} · ${cls.grade} · ${cls.academicYear}` : 'Loading…'}
      size="lg"
    >
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && cls && (
        <div className="space-y-6">
          {/* Status banner */}
          <div className="flex items-center flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
            <Badge label={cls.isActive ? 'Active' : 'Inactive'} color={cls.isActive ? 'green' : 'red'} />
            <Badge label={capitalize(cls.classType)} color="blue" />
            <Badge label={capitalize(cls.medium)} color="teal" />
            {cls.branch && <Badge label={cls.branch.name} color="gray" />}
          </div>

          <InfoSection title="Class Info">
            <Row label="Name"           value={cls.name} />
            <Row label="Serial No."     value={cls.serialNumber} />
            <Row label="Grade"          value={cls.grade} />
            <Row label="Class Type"     value={capitalize(cls.classType)} />
            <Row label="Medium"         value={capitalize(cls.medium)} />
            <Row label="Academic Year"  value={cls.academicYear} />
            <Row label="Total Capacity" value={cls.totalCapacity ?? '—'} />
            <Row label="Branch"         value={cls.branch?.name} />
            {cls.classTeacherInfo && (
              <Row label="Class Teacher" value={`${cls.classTeacherInfo.user?.name} (${cls.classTeacherInfo.designation})`} />
            )}
            <Row label="Created" value={fmt(cls.createdAt)} />
          </InfoSection>
        </div>
      )}
    </Modal>
  );
}
