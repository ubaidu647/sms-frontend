'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Bus, Map, UserCheck } from 'lucide-react';

const TABS = [
  {
    label: 'Vehicles',
    href: '/dashboard/school/transport/vehicles',
    icon: Bus,
    canAccess: ({ isAdmin, actions }) =>
      isAdmin || actions.includes('view-vehicle') || actions.includes('view-all-branch-vehicle'),
  },
  {
    label: 'Routes',
    href: '/dashboard/school/transport/routes',
    icon: Map,
    canAccess: ({ isAdmin, actions }) =>
      isAdmin || actions.includes('view-route') || actions.includes('view-all-branch-route'),
  },
  {
    label: 'Assignments',
    href: '/dashboard/school/transport/assignments',
    icon: UserCheck,
    canAccess: ({ isAdmin, actions }) =>
      isAdmin ||
      actions.includes('view-transport-assignment') ||
      actions.includes('view-all-branch-transport-assignment'),
  },
];

export default function TransportLayout({ children }) {
  const pathname = usePathname();
  const { user } = useUserStore();
  const isAdmin = !!user?.role?.isPredefined;
  const actions = user?.role?.actions || [];

  const visibleTabs = TABS.filter((t) => t.canAccess({ isAdmin, actions }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== '/dashboard/school/transport' && pathname.startsWith(tab.href));
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
