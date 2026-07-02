'use client';
import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { ClipboardCheck, BarChart3, AlertTriangle, CalendarRange } from 'lucide-react';
import MarkStaffAttendancePanel from './MarkStaffAttendancePanel';
import MonthlyStaffSummaryPanel from './MonthlyStaffSummaryPanel';
import UnmarkedBranchesPanel from './UnmarkedBranchesPanel';
import CalendarViewPanel from './CalendarViewPanel';
import OwnAttendancePanel from './OwnAttendancePanel';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import { useTranslations } from 'next-intl';

export default function StaffAttendancePage() {
  const { user } = useUserStore();
  const t = useTranslations('staffAttendance');

  const scope = resolveScope(user?.role, 'view-staff-attendance');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const canView = scope !== 'none';
  const canMark = hasAnyAction(user?.role, [
    'mark-staff-attendance',
    'mark-all-branch-staff-attendance',
  ]);

  const [activeTab, setActiveTab] = useState('mark');

  // Own-scope: render only the personal history view (no branch roster, no marking).
  if (isOwnOnly) {
    return (
      <div className="md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
          <div className="mb-6 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('ownTitle')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('ownSubtitle')}
            </p>
          </div>
          <OwnAttendancePanel />
        </div>
      </div>
    );
  }

  const tabs = [];
  if (canMark || canView) tabs.push({ key: 'mark', label: 'Daily Mark', icon: ClipboardCheck });
  if (canView) tabs.push({ key: 'calendar', label: 'Calendar View', icon: CalendarRange });
  if (canView) tabs.push({ key: 'summary', label: 'Monthly Summary', icon: BarChart3 });
  if (isOrgLevel) tabs.push({ key: 'unmarked', label: 'Unmarked Branches', icon: AlertTriangle });

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className="mb-6 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
          <div className="inline-flex gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    isActive ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'mark' && <MarkStaffAttendancePanel />}
        {activeTab === 'calendar' && <CalendarViewPanel />}
        {activeTab === 'summary' && <MonthlyStaffSummaryPanel />}
        {activeTab === 'unmarked' && <UnmarkedBranchesPanel />}
      </div>
    </div>
  );
}
