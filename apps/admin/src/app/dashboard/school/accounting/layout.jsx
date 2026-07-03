'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { ListTree, BookOpen, FileBarChart2, Link2, Lock, Receipt } from 'lucide-react';
import { canSee, resolveScope } from '@/utils/permissions';

const branchOnly = (role, base) => {
  const scope = resolveScope(role, base);
  return scope === 'all' || scope === 'branch';
};

const TABS = [
  {
    label: 'Chart of Accounts',
    href: '/dashboard/school/accounting/accounts',
    icon: ListTree,
    canAccess: (role) => canSee(role, 'view-account'),
  },
  {
    label: 'Journal Entries',
    href: '/dashboard/school/accounting/journals',
    icon: BookOpen,
    canAccess: (role) => canSee(role, 'view-journal'),
  },
  {
    label: 'Account Ledger',
    href: '/dashboard/school/accounting/ledger',
    icon: Receipt,
    canAccess: (role) => canSee(role, 'view-journal'),
  },
  {
    label: 'Reports',
    href: '/dashboard/school/accounting/reports',
    icon: FileBarChart2,
    canAccess: (role) => branchOnly(role, 'view-financial-report'),
  },
  {
    label: 'Mapping',
    href: '/dashboard/school/accounting/mapping',
    icon: Link2,
    canAccess: (role) => branchOnly(role, 'view-account-mapping'),
  },
  {
    label: 'Periods',
    href: '/dashboard/school/accounting/periods',
    icon: Lock,
    canAccess: (role) => branchOnly(role, 'view-accounting-period'),
  },
];

export default function AccountingLayout({ children }) {
  const pathname = usePathname();
  const { user } = useUserStore();

  const visibleTabs = TABS.filter((t) => t.canAccess(user?.role));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800 rounded-[20px]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 w-full print:hidden">
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          {visibleTabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href);
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
      <div className="flex-1 overflow-y-auto scrollbar-hide">{children}</div>
    </div>
  );
}
