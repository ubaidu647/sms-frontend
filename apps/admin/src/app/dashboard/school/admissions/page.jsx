'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ClipboardList, Globe } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { resolveScope } from '@/utils/permissions';
import { admissionPermissions } from '@/utils/admission';
import OverviewPanel from './OverviewPanel';
import EnquiriesPanel from './EnquiriesPanel';
import FormsPanel from './FormsPanel';

export default function AdmissionsPage() {
  const { user } = useUserStore();
  const t = useTranslations('admissions');
  const role = user?.role;
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const perms = admissionPermissions(role);
  // Org tier = may look across branches (branch filter shown).
  const orgTier =
    resolveScope(role, 'view-enquiry') === 'all' || resolveScope(role, 'manage-enquiry') === 'all';
  const formsOrgTier = resolveScope(role, 'manage-admission-form') === 'all';

  const tabs = [];
  if (perms.canView) {
    tabs.push({ key: 'overview', label: t('tabOverview'), icon: LayoutDashboard });
    tabs.push({ key: 'enquiries', label: t('tabEnquiries'), icon: ClipboardList });
  }
  if (perms.canForms) tabs.push({ key: 'forms', label: t('tabForms'), icon: Globe });

  const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'overview');

  if (!tabs.length) {
    return (
      <div className="md:flex-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-3xl mx-auto text-center py-16 text-gray-600 dark:text-gray-400">
          {t('noPermission')}
        </div>
      </div>
    );
  }

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        <div className="mb-6 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
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

        {activeTab === 'overview' && <OverviewPanel orgTier={orgTier} />}
        {activeTab === 'enquiries' && (
          <EnquiriesPanel role={role} orgTier={orgTier} userBranchId={userBranchId} />
        )}
        {activeTab === 'forms' && <FormsPanel orgTier={formsOrgTier} userBranchId={userBranchId} />}
      </div>
    </div>
  );
}
