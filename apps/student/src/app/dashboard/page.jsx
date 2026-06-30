'use client';
import Link from 'next/link';
import {
  CalendarCheck,
  Wallet,
  Megaphone,
  BarChart3,
  CalendarDays,
  Pin,
  ChevronRight,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useProfile, useAttendance, useFees, useAnnouncements } from '@/hooks/useDashboard';
import { Panel } from '@/component/dashboard/Panel';
import AttendanceRing from '@/component/dashboard/AttendanceRing';
import { formatMoney, formatDate } from '@/utils/format';

export default function StudentDashboard() {
  const user = useUserStore((s) => s.user);
  const profile = useProfile();
  const attendance = useAttendance();
  const fees = useFees();
  const announcements = useAnnouncements({ page: 1, limit: 5 });

  const me = profile.data;
  const attSummary = attendance.data?.summary;
  const outstanding = fees.data?.summary?.outstandingBalance ?? 0;
  const announceItems = announcements.data?.items ?? [];

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Welcome{me?.name || user?.name ? `, ${me?.name || user?.name}` : ''} 👋
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {me?.classId?.name && me?.sectionId?.name
          ? `${me.classId.name} · ${me.sectionId.name}`
          : 'Here’s a snapshot of your school activity.'}
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance ring */}
        <Panel title="Attendance" className="lg:col-span-1">
          <Link href="/dashboard/attendance" className="flex flex-col items-center no-underline">
            <AttendanceRing percentage={attSummary?.presentPercentage ?? 0} />
            <div className="mt-3 grid grid-cols-3 gap-3 w-full text-center">
              <Stat label="Present" value={attSummary?.present ?? 0} tone="text-[#00918e]" />
              <Stat label="Absent" value={attSummary?.absent ?? 0} tone="text-red-500" />
              <Stat label="Late" value={attSummary?.late ?? 0} tone="text-[#f5b21c]" />
            </div>
          </Link>
        </Panel>

        {/* Fees + quick links */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
          <Link href="/dashboard/fees" className="no-underline">
            <div className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 p-5 h-full hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Wallet className="w-5 h-5 text-[#00918e]" />
                <span className="text-sm">Amount due</span>
              </div>
              <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {fees.isLoading ? '—' : formatMoney(outstanding)}
              </div>
              <div
                className={`mt-1 text-xs ${outstanding > 0 ? 'text-red-500' : 'text-[#00918e]'}`}
              >
                {outstanding > 0 ? 'Outstanding balance' : 'All cleared'}
              </div>
            </div>
          </Link>

          <QuickLink
            href="/dashboard/results"
            icon={BarChart3}
            label="Results"
            sub="View exam grades"
          />
          <QuickLink
            href="/dashboard/timetable"
            icon={CalendarDays}
            label="Timetable"
            sub="Weekly classes"
          />
          <QuickLink
            href="/dashboard/attendance"
            icon={CalendarCheck}
            label="Attendance"
            sub="Records & history"
          />
        </div>
      </div>

      {/* Announcements */}
      <div className="mt-4">
        <Panel
          title="Announcements"
          action={
            <Link
              href="/dashboard/announcements"
              className="text-xs font-medium text-[#00918e] hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
          padded={false}
        >
          {announcements.isLoading ? (
            <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          ) : announceItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <Megaphone className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="mt-2">No announcements right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {announceItems.map((a, i) => (
                <li key={a._id || i} className="px-5 py-3 flex items-start gap-3">
                  {a.isPinned ? (
                    <Pin className="w-4 h-4 text-[#f5b21c] mt-0.5 flex-shrink-0" />
                  ) : (
                    <Megaphone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {a.body}
                    </p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(a.publishedAt || a.createdAt, { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div>
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, sub }) {
  return (
    <Link href={href} className="no-underline">
      <div className="group rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 p-5 h-full hover:shadow-lg transition-shadow">
        <div className="w-10 h-10 rounded-xl bg-[#00918e]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#00918e]" />
        </div>
        <div className="mt-3 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#00918e] transition-colors">
          {label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{sub}</div>
      </div>
    </Link>
  );
}
