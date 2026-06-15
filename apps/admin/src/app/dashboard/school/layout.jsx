'use client';
import { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { Sidebar } from '@/component/SideBar';
import { Topbar } from '@/component/TopBar';

export default function SchoolLayout({ children }) {
  const { user } = useUserStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="w-full md:w-[99%] flex h-screen overflow-hidden">
      <Sidebar
        user={user}
        menus={user?.role?.menus || []}
        actions={user?.role?.actions || []}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 bg-[rgb(246,246,246)] dark:bg-[#161616] p-3 sm:p-6 pt-[calc(4rem+0.75rem)] md:pt-6 rounded-none md:!rounded-tl-[50px] md:!rounded-tr-[50px] z-1 md:mt-3 overflow-y-auto md:overflow-hidden flex flex-col">
        <Topbar user={user} userRole={user?.role} onMenuClick={() => setIsMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
}
