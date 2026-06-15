'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { LayoutDashboard, ListTree, Receipt, Scale } from 'lucide-react';
import { canSee, canEditScope } from '@/utils/permissions';

const TABS = [
  {
    label: 'Dashboard',
    href: '/dashboard/school/staff-salary/dashboard',
    icon: LayoutDashboard,
    // Branch-aggregate view — needs the menu AND a non-own payslip grant.
    canAccess: (role, menus) =>
      menus.includes('salary-dashboard') && canEditScope(role, 'view-payslip'),
  },
  {
    label: 'Salary Structures',
    href: '/dashboard/school/staff-salary/structures',
    icon: ListTree,
    canAccess: (role) => canSee(role, 'view-staff-salary'),
  },
  {
    label: 'Payslips',
    href: '/dashboard/school/staff-salary/payslips',
    icon: Receipt,
    canAccess: (role) => canSee(role, 'view-payslip'),
  },
  {
    label: 'Policy',
    href: '/dashboard/school/staff-salary/policy',
    icon: Scale,
    canAccess: (role) => canSee(role, 'view-staff-salary-policy'),
  },
];

export default function StaffSalaryLayout({ children }) {
  const pathname = usePathname();
  const { user } = useUserStore();
  const menus = user?.role?.menus || [];

  const isPredefined = !!user?.role?.isPredefined;
  const visibleTabs = TABS.filter((t) => isPredefined || t.canAccess(user?.role, menus));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800 rounded-[20px]">
      <div className="max-w-7xl mx-auto px-6 pt-6 w-full">
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          {visibleTabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== '/dashboard/school/staff-salary' && pathname.startsWith(tab.href));
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
