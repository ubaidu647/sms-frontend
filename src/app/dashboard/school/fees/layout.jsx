'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import {
  ListTree,
  Receipt,
  Wallet,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { canSee, resolveScope } from '@/utils/permissions';

const branchOnly = (role, base) => {
  const scope = resolveScope(role, base);
  return scope === 'all' || scope === 'branch';
};

const TABS = [
  {
    label: 'Vouchers',
    href: '/dashboard/school/fees/vouchers',
    icon: Receipt,
    canAccess: (role) => canSee(role, 'view-fee'),
  },
  {
    label: 'Payments',
    href: '/dashboard/school/fees/payments',
    icon: Wallet,
    canAccess: (role) => canSee(role, 'view-payment'),
  },
  {
    label: 'Structures',
    href: '/dashboard/school/fees/structures',
    icon: ListTree,
    // Structures are admin/branch tools — not relevant for an own-scope user.
    canAccess: (role) => branchOnly(role, 'view-fee'),
  },
  {
    label: 'Collection',
    href: '/dashboard/school/fees/reports/collection',
    icon: TrendingUp,
    canAccess: (role) => branchOnly(role, 'view-payment'),
  },
  {
    label: 'Outstanding',
    href: '/dashboard/school/fees/reports/outstanding',
    icon: TrendingDown,
    canAccess: (role) => branchOnly(role, 'view-fee'),
  },
];

export default function FeesLayout({ children }) {
  const pathname = usePathname();
  const { user } = useUserStore();

  const visibleTabs = TABS.filter((t) => t.canAccess(user?.role));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== '/dashboard/school/fees' && pathname.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
