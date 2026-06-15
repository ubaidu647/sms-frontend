'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

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

function Badge({ label, color }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    teal: 'bg-teal-100 text-teal-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium ${colors[color] || colors.gray}`}
    >
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

export default function StaffDetailModal({ isOpen, onClose, staffId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['staff-detail', staffId],
    queryFn: () => fetchData({ url: `/staff/${staffId}`, token }),
    enabled: !!token && !!staffId && isOpen,
    staleTime: 30000,
  });

  const s = data?.data;

  const name = s?.user?.name || '';
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || '?';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Details"
      subtitle={s ? `${s.user?.name} · ${s.serialNumber}` : 'Loading…'}
      size="xl"
    >
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && s && (
        <div className="space-y-4">
          {/* Identity header */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100">
            <div className="relative flex-shrink-0">
              {s.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.photo}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-teal-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-24 h-24 rounded-full bg-teal-100 text-teal-700 dark:text-teal-400 font-bold text-2xl items-center justify-center border-4 border-white shadow-md ring-2 ring-teal-200"
                style={{ display: s.photo ? 'none' : 'flex' }}
              >
                {initials}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {s.user?.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {s.designation}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {s.serialNumber} · {s.user?.email}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge
                  label={s.isActive ? 'Active' : 'Blocked'}
                  color={s.isActive ? 'green' : 'red'}
                />
                <Badge
                  label={s.staffType === 'teaching' ? 'Teaching' : 'Non-Teaching'}
                  color={s.staffType === 'teaching' ? 'teal' : 'yellow'}
                />
                <Badge label={s.employmentType} color="blue" />
                {s.role?.isPredefined && <Badge label="Predefined Role" color="gray" />}
              </div>
            </div>
          </div>

          {/* Employment */}
          <Section title="Employment">
            <Row label="Role" value={s.role?.name} />
            <Row label="Branch" value={s.branch?.name} />
            <Row label="Qualification" value={s.qualification} />
            <Row
              label="Experience"
              value={s.experienceYears != null ? `${s.experienceYears} yrs` : null}
            />
            <Row
              label="Salary"
              value={s.salary != null ? `PKR ${s.salary.toLocaleString()}` : null}
            />
            <Row label="Joining Date" value={fmt(s.joiningDate)} />
            {s.leavingDate && <Row label="Leaving Date" value={fmt(s.leavingDate)} />}
            {s.leavingReason && <Row label="Leaving Reason" value={s.leavingReason} />}
          </Section>

          {/* Personal */}
          <Section title="Personal">
            <Row
              label="Gender"
              value={s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : null}
            />
            <Row label="Date of Birth" value={fmt(s.dob)} />
            <Row label="CNIC" value={s.cnic} />
            <Row label="Blood Group" value={s.bloodGroup} />
            <Row
              label="Marital Status"
              value={
                s.maritalStatus
                  ? s.maritalStatus.charAt(0).toUpperCase() + s.maritalStatus.slice(1)
                  : null
              }
            />
            <Row label="Phone" value={s.phone} />
            <Row label="User Serial" value={s.user?.serialNumber} />
            <Row label="Created" value={fmt(s.createdAt)} />
          </Section>

          {(s.address || s.emergencyContact) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {s.address && (
                <Section title="Address" cols={3}>
                  <Row label="Street" value={s.address.street} className="col-span-3" />
                  <Row label="City" value={s.address.city} />
                  <Row label="State" value={s.address.state} />
                </Section>
              )}

              {s.emergencyContact && (
                <Section title="Emergency Contact" cols={3}>
                  <Row label="Name" value={s.emergencyContact.name} />
                  <Row label="Phone" value={s.emergencyContact.phone} />
                  <Row label="Relation" value={s.emergencyContact.relation} />
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
