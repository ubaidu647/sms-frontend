'use client';
import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { ClipboardCheck, BarChart3, AlertTriangle, CalendarRange } from 'lucide-react';
import MarkAttendancePanel from './MarkAttendancePanel';
import MonthlySummaryPanel from './MonthlySummaryPanel';
import UnmarkedSectionsPanel from './UnmarkedSectionsPanel';
import CalendarViewPanel from './CalendarViewPanel';
import OwnStudentAttendancePanel from './OwnStudentAttendancePanel';
import { resolveScope, hasAnyAction } from '@/utils/permissions';

export default function AttendancePage() {
  const { user } = useUserStore();

  const scope = resolveScope(user?.role, 'view-attendance');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const canView = scope !== 'none';
  const canMark = hasAnyAction(user?.role, [
    'mark-attendance',
    'mark-all-branch-attendance',
  ]);

  // Own-scope: render the personal attendance history view only.
  if (isOwnOnly) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-1">Your own attendance history.</p>
          </div>
          <OwnStudentAttendancePanel />
        </div>
      </div>
    );
  }

  const tabs = [];
  if (canMark || canView) tabs.push({ key: 'mark', label: 'Mark Attendance', icon: ClipboardCheck });
  if (canView) tabs.push({ key: 'calendar', label: 'Calendar View', icon: CalendarRange });
  if (canView) tabs.push({ key: 'summary', label: 'Monthly Summary', icon: BarChart3 });
  if (isOrgLevel || canView) tabs.push({ key: 'unmarked', label: 'Unmarked Sections', icon: AlertTriangle });

  const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'mark');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-1">Mark and review student attendance</p>
          </div>
        </div>

        {/* Tabs */}
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

        {activeTab === 'mark' && <MarkAttendancePanel />}
        {activeTab === 'calendar' && <CalendarViewPanel />}
        {activeTab === 'summary' && <MonthlySummaryPanel />}
        {activeTab === 'unmarked' && <UnmarkedSectionsPanel />}
      </div>
    </div>
  );
}
