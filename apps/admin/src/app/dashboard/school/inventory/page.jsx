'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Boxes,
  PackageMinus,
  ShoppingCart,
  Truck,
  Monitor,
  Store,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { canEditScope, resolveScope } from '@/utils/permissions';
import { BranchSelect } from '../leave/LeavePickers';
import OverviewPanel from './OverviewPanel';
import ItemsPanel from './ItemsPanel';
import IssuePanel from './IssuePanel';
import PurchasesPanel from './PurchasesPanel';
import SuppliersPanel from './SuppliersPanel';
import AssetsPanel from './AssetsPanel';
import ShopPanel from './ShopPanel';
import { labelCls } from './inventoryShared';

export default function InventoryPage() {
  const { user } = useUserStore();
  const t = useTranslations('inventory');
  const role = user?.role;
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const can = (base) => canEditScope(role, base);
  const isOrg = (base) => resolveScope(role, base) === 'all';

  const canView = can('view-inventory');
  const canManageInv = can('manage-inventory');
  const canPurchase = can('manage-purchase');
  const canAsset = can('manage-asset');
  const canShop = can('manage-shop-sale');

  const perms = {
    role,
    userBranchId,
    canView,
    canManageInv,
    canPurchase,
    canAsset,
    canShop,
    orgView: isOrg('view-inventory'),
    orgInv: isOrg('manage-inventory'),
    orgPurchase: isOrg('manage-purchase'),
    orgAsset: isOrg('manage-asset'),
    orgShop: isOrg('manage-shop-sale'),
  };
  const anyOrg =
    perms.orgView || perms.orgInv || perms.orgPurchase || perms.orgAsset || perms.orgShop;

  const tabs = [];
  if (canView) tabs.push({ key: 'overview', icon: LayoutDashboard });
  if (canView || canManageInv) tabs.push({ key: 'items', icon: Boxes });
  if (canManageInv) tabs.push({ key: 'issue', icon: PackageMinus });
  if (canPurchase) tabs.push({ key: 'purchases', icon: ShoppingCart });
  if (canPurchase) tabs.push({ key: 'suppliers', icon: Truck });
  if (canAsset || canView) tabs.push({ key: 'assets', icon: Monitor });
  if (canShop) tabs.push({ key: 'shop', icon: Store });

  const [pickedTab, setActiveTab] = useState(null);
  const activeTab = tabs.some((x) => x.key === pickedTab) ? pickedTab : tabs[0]?.key;
  // Org-tier users pick a branch ('' = all branches); branch-tier users are
  // pinned to their own branch by the API.
  const [branchId, setBranchId] = useState('');

  if (!tabs.length) {
    return (
      <div className="md:flex-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-3xl mx-auto text-center py-16 text-gray-600 dark:text-gray-400">
          You do not have permission to use inventory.
        </div>
      </div>
    );
  }

  const props = { ...perms, branchId };

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
          {anyOrg && (
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
                  {t(`tabs.${tab.key}`)}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'overview' && <OverviewPanel {...props} />}
        {activeTab === 'items' && <ItemsPanel {...props} />}
        {activeTab === 'issue' && <IssuePanel {...props} />}
        {activeTab === 'purchases' && <PurchasesPanel {...props} />}
        {activeTab === 'suppliers' && <SuppliersPanel {...props} />}
        {activeTab === 'assets' && <AssetsPanel {...props} />}
        {activeTab === 'shop' && <ShopPanel {...props} />}
      </div>
    </div>
  );
}
