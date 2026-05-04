'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { LayoutDashboard, ListTree, Receipt } from 'lucide-react';
import { canSee, resolveScope } from '@/utils/permissions';

const TABS = [
  {
    label: 'Dashboard',
    href: '/dashboard/school/staff-salary/dashboard',
    icon: LayoutDashboard,
    // Dashboard is a branch-aggregate view — own-scope users shouldn't see it.
    canAccess: (role) => {
      const scope = resolveScope(role, 'view-payslip');
      return scope === 'all' || scope === 'branch';
    },
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
];

export default function StaffSalaryLayout({ children }) {
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
              (tab.href !== '/dashboard/school/staff-salary' &&
                pathname.startsWith(tab.href));
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
