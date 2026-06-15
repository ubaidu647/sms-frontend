'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Inbox, ListTree } from 'lucide-react';

const TABS = [
  {
    label: 'Feed',
    href: '/dashboard/school/announcements/feed',
    icon: Inbox,
    canAccess: () => true,
  },
  {
    label: 'Manage',
    href: '/dashboard/school/announcements',
    icon: ListTree,
    exact: true,
    canAccess: ({ isAdmin, actions }) =>
      isAdmin ||
      actions.includes('view-announcement') ||
      actions.includes('view-all-branch-announcement'),
  },
];

export default function AnnouncementsLayout({ children }) {
  const pathname = usePathname();
  const { user } = useUserStore();
  const isAdmin = !!user?.role?.isPredefined;
  const actions = user?.role?.actions || [];

  const visible = TABS.filter((t) => t.canAccess({ isAdmin, actions }));

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-3 sm:pt-6 md:flex-1 md:min-h-0 flex flex-col">
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {visible.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
