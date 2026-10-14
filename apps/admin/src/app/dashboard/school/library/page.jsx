'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ScanLine, BookOpen, ListChecks, SlidersHorizontal } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { canEditScope, resolveScope } from '@/utils/permissions';
import { BranchSelect } from '../leave/LeavePickers';
import OverviewPanel from './OverviewPanel';
import CirculationPanel from './CirculationPanel';
import CataloguePanel from './CataloguePanel';
import LoansPanel from './LoansPanel';
import SettingsPanel from './SettingsPanel';
import { labelCls } from './libraryShared';

export default function LibraryPage() {
  const { user } = useUserStore();
  const t = useTranslations('library');
  const role = user?.role;
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const viewScope = resolveScope(role, 'view-library');
  const manageScope = resolveScope(role, 'manage-library');
  const settingsScope = resolveScope(role, 'manage-library-settings');
  const canManage = canEditScope(role, 'manage-library');
  const canView = canEditScope(role, 'view-library') || canManage;
  const canSettings = canEditScope(role, 'manage-library-settings');
  const orgTier = viewScope === 'all' || manageScope === 'all';

  const tabs = [];
  if (canView) tabs.push({ key: 'overview', label: 'Overview', icon: LayoutDashboard });
  if (canManage) tabs.push({ key: 'circulation', label: 'Circulation', icon: ScanLine });
  if (canView) tabs.push({ key: 'catalogue', label: 'Catalogue', icon: BookOpen });
  if (canView) tabs.push({ key: 'loans', label: 'Loans', icon: ListChecks });
  if (canSettings) tabs.push({ key: 'settings', label: 'Settings', icon: SlidersHorizontal });

  const defaultTab = tabs.some((x) => x.key === 'circulation')
    ? 'circulation'
    : tabs[0]?.key || 'overview';
  const [pickedTab, setActiveTab] = useState(null);
  // Falls back to the default while the user/role is still loading.
  const activeTab = tabs.some((x) => x.key === pickedTab) ? pickedTab : defaultTab;
  // Org-tier users pick a branch ('' = all branches); branch-tier users are
  // pinned to their own branch by the API.
  const [branchId, setBranchId] = useState('');

  if (!tabs.length) {
    return (
      <div className="md:flex-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-3xl mx-auto text-center py-16 text-gray-600 dark:text-gray-400">
          You do not have permission to use the library.
        </div>
      </div>
    );
  }

  const showBranchFilter = orgTier && ['overview', 'catalogue', 'loans'].includes(activeTab);

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </div>
          {showBranchFilter && (
            <div className="w-full sm:w-64">
              <label className={labelCls}>Branch</label>
              <BranchSelect value={branchId} onChange={setBranchId} allLabel="All branches" />
            </div>
          )}
        </div>

        <div className="mb-6 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
          <div className="inline-flex gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'overview' && <OverviewPanel branchId={branchId} />}
        {activeTab === 'circulation' && <CirculationPanel />}
        {activeTab === 'catalogue' && (
          <CataloguePanel
            role={role}
            userBranchId={userBranchId}
            branchId={branchId}
            orgTier={manageScope === 'all'}
            canManageAny={canManage}
          />
        )}
        {activeTab === 'loans' && (
          <LoansPanel role={role} userBranchId={userBranchId} branchId={branchId} />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel orgTier={settingsScope === 'all'} userBranchId={userBranchId} />
        )}
      </div>
    </div>
  );
}
