'use client';
import { UserRound } from 'lucide-react';
import { useProfile } from '@/hooks/useDashboard';
import { PageHeader, Panel } from '@/component/dashboard/Panel';
import { Loading, ErrorState } from '@/component/dashboard/States';
import { formatDate } from '@/utils/format';

export default function ProfilePage() {
  const { data: me, isLoading, isError, error, refetch } = useProfile();

  return (
    <div className="max-w-4xl">
      <PageHeader icon={UserRound} title="My Profile" subtitle="Your student record" />

      {isLoading ? (
        <Loading label="Loading profile…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Panel padded={false}>
          {/* Header band */}
          <div className="flex items-center gap-4 p-6 border-b border-gray-100 dark:border-gray-800">
            {me?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.photo}
                alt={me?.name || 'Student'}
                className="w-20 h-20 rounded-2xl object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#00918e] flex items-center justify-center text-white text-2xl font-bold">
                {(me?.name || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {me?.name || '—'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{me?.email || '—'}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {me?.classId?.name && <Badge>{me.classId.name}</Badge>}
                {me?.sectionId?.name && <Badge>{me.sectionId.name}</Badge>}
                {me?.academicStatus && <Badge tone="active">{me.academicStatus}</Badge>}
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 p-6">
            <Field label="Serial number" value={me?.serialNumber} />
            <Field label="Admission number" value={me?.admissionNumber} />
            <Field label="Roll number" value={me?.rollNumber} />
            <Field label="Academic year" value={me?.academicYear} />
            <Field label="Gender" value={me?.gender} />
            <Field label="Date of birth" value={me?.dob ? formatDate(me.dob) : null} />
            <Field label="Blood group" value={me?.bloodGroup} />
            <Field label="Phone" value={me?.phone} />
            <Field label="Academic status" value={me?.academicStatus} />
          </dl>
        </Panel>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100 break-words capitalize">
        {value || '—'}
      </dd>
    </div>
  );
}

function Badge({ children, tone }) {
  const cls =
    tone === 'active'
      ? 'bg-[#00918e]/10 text-[#00918e]'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {children}
    </span>
  );
}
