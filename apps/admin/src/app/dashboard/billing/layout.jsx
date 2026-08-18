'use client';
import { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { Sidebar } from '@/component/SideBar';
import { Topbar } from '@/component/TopBar';

// Billing is the school's own subscription and invoices — account admin, not
// school operations — so it sits behind the topbar menu with its own shell.
export default function BillingLayout({ children }) {
  const { user } = useUserStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
        <div className="flex-1 min-h-0 md:overflow-hidden flex flex-col mt-3">{children}</div>
      </div>
    </div>
  );
}
