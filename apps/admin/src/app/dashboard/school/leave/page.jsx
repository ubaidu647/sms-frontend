'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardList, PlusCircle, SlidersHorizontal, Wallet } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { canEditScope, resolveScope } from '@/utils/permissions';
import RequestsPanel from './RequestsPanel';
import NewLeavePanel from './NewLeavePanel';
import QuotasPanel from './QuotasPanel';
import BalancePanel from './BalancePanel';

export default function LeavePage() {
  const { user } = useUserStore();
  const t = useTranslations('leave');
  const role = user?.role;
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const viewScope = resolveScope(role, 'view-leave');
  const approveScope = resolveScope(role, 'approve-leave');
  const policyScope = resolveScope(role, 'manage-leave-policy');
  const canView = viewScope !== 'none' || approveScope !== 'none';
  const canApprove = canEditScope(role, 'approve-leave');
  const canPolicy = canEditScope(role, 'manage-leave-policy');
  const requestsOrgTier = viewScope === 'all' || approveScope === 'all';

  const tabs = [];
  if (canView) tabs.push({ key: 'requests', label: 'Requests', icon: ClipboardList });
  if (canApprove) tabs.push({ key: 'new', label: 'New Leave', icon: PlusCircle });
  if (canPolicy) tabs.push({ key: 'quotas', label: 'Quotas', icon: SlidersHorizontal });
  if (canView) tabs.push({ key: 'balance', label: 'Staff Balance', icon: Wallet });

  const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'requests');

  if (!tabs.length) {
    return (
      <div className="md:flex-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-3xl mx-auto text-center py-16 text-gray-600 dark:text-gray-400">
          You do not have permission to manage leave.
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

        {activeTab === 'requests' && (
          <RequestsPanel role={role} orgTier={requestsOrgTier} userBranchId={userBranchId} />
        )}
        {activeTab === 'new' && (
          <NewLeavePanel
            canApprove={canApprove}
            orgTier={approveScope === 'all'}
            onCreated={() => canView && setActiveTab('requests')}
          />
        )}
        {activeTab === 'quotas' && (
          <QuotasPanel orgTier={policyScope === 'all'} userBranchId={userBranchId} />
        )}
        {activeTab === 'balance' && <BalancePanel orgTier={requestsOrgTier} />}
      </div>
    </div>
  );
}
