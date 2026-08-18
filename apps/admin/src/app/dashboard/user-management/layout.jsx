'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Sidebar } from '@/component/SideBar';
import { Topbar } from '@/component/TopBar';
import { USER_MANAGEMENT_TABS } from './tabs';

export default function UserManagementLayout({ children }) {
  const { user } = useUserStore();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleTabs = USER_MANAGEMENT_TABS.filter((t) => t.canAccess(user?.role));

  return (
    <div className="w-full md:w-[99%] flex h-screen overflow-hidden print:block print:h-auto print:w-full print:overflow-visible">
      <Sidebar
        user={user}
        menus={user?.role?.menus || []}
        actions={user?.role?.actions || []}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 bg-[rgb(246,246,246)] dark:bg-[#161616] p-3 sm:p-6 pt-[calc(4rem+0.75rem)] md:pt-6 rounded-none md:!rounded-tl-[50px] md:!rounded-tr-[50px] z-1 md:mt-3 overflow-y-auto md:overflow-hidden flex flex-col print:block print:p-0 print:!pt-0 print:!mt-0 print:bg-white print:dark:bg-white print:!rounded-none print:overflow-visible">
        <Topbar user={user} userRole={user?.role} onMenuClick={() => setIsMobileOpen(true)} />

        {/* Tab strip only — each tab's page brings its own header and card. */}
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-2 print:hidden">
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
            {visibleTabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap no-underline ${
                    isActive
                      ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 md:overflow-hidden flex flex-col mt-3">{children}</div>
      </div>
    </div>
  );
}
