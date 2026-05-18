'use client';
import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import {
  CalendarDays,
  Settings2,
  Clock,
  UserCheck,
  AlertTriangle,
  User,
} from 'lucide-react';
import EditorPanel from './EditorPanel';
import PeriodConfigsPanel from './PeriodConfigsPanel';
import NowPanel from './NowPanel';
import FreeTeachersPanel from './FreeTeachersPanel';
import ConflictsPanel from './ConflictsPanel';
import MyTimetablePanel from './MyTimetablePanel';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import { useTranslations } from 'next-intl';

export default function TimetablePage() {
  const { user } = useUserStore();
  const t = useTranslations('timetable');

  const scope = resolveScope(user?.role, 'view-timetable');
  const isOwnOnly = scope === 'own';
  const canView = scope !== 'none';
  const canEdit =
    !isOwnOnly &&
    hasAnyAction(user?.role, [
      'create-timetable',
      'update-timetable',
      'create-all-branch-timetable',
      'update-all-branch-timetable',
    ]);

  // Own-scope users see only their personal schedule.
  if (isOwnOnly) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('ownTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('ownSubtitle')}</p>
          </div>
          <MyTimetablePanel />
        </div>
      </div>
    );
  }

  const tabs = [];
  if (canView) tabs.push({ key: 'editor', label: 'Section Editor', icon: CalendarDays });
  if (canEdit) tabs.push({ key: 'configs', label: 'Period Configs', icon: Settings2 });
  if (canView) tabs.push({ key: 'now', label: 'Now', icon: Clock });
  if (canView) tabs.push({ key: 'free', label: 'Free Teachers', icon: UserCheck });
  if (canView) tabs.push({ key: 'conflicts', label: 'Conflicts', icon: AlertTriangle });
  if (canView) tabs.push({ key: 'my', label: 'My Schedule', icon: User });

  const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'editor');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
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

        {activeTab === 'editor' && <EditorPanel />}
        {activeTab === 'configs' && <PeriodConfigsPanel />}
        {activeTab === 'now' && <NowPanel />}
        {activeTab === 'free' && <FreeTeachersPanel />}
        {activeTab === 'conflicts' && <ConflictsPanel />}
        {activeTab === 'my' && <MyTimetablePanel />}
      </div>
    </div>
  );
}
