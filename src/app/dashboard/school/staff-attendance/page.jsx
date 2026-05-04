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

export default function StaffAttendancePage() {
  const { user } = useUserStore();

  const scope = resolveScope(user?.role, 'view-staff-attendance');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const canView = scope !== 'none';
  const canMark = hasAnyAction(user?.role, [
    'mark-staff-attendance',
    'mark-all-branch-staff-attendance',
  ]);

  // Own-scope: render only the personal history view (no branch roster, no marking).
  if (isOwnOnly) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Staff Attendance</h1>
            <p className="text-gray-600 mt-1">Your own attendance history.</p>
          </div>
          <OwnAttendancePanel />
        </div>
      </div>
    );
  }

  const tabs = [];
  if (canMark || canView)
    tabs.push({ key: 'mark', label: 'Daily Mark', icon: ClipboardCheck });
  if (canView)
    tabs.push({ key: 'calendar', label: 'Calendar View', icon: CalendarRange });
  if (canView)
    tabs.push({ key: 'summary', label: 'Monthly Summary', icon: BarChart3 });
  if (isOrgLevel)
    tabs.push({ key: 'unmarked', label: 'Unmarked Branches', icon: AlertTriangle });

  const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'mark');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Attendance</h1>
            <p className="text-gray-600 mt-1">
              Mark and review daily staff attendance for payroll
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-gray-200 w-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'mark' && <MarkStaffAttendancePanel />}
        {activeTab === 'calendar' && <CalendarViewPanel />}
        {activeTab === 'summary' && <MonthlyStaffSummaryPanel />}
        {activeTab === 'unmarked' && <UnmarkedBranchesPanel />}
      </div>
    </div>
  );
}
