'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Sidebar } from '@/component/SideBar';
import { Topbar } from '@/component/TopBar';
import { PlanRouteGuard } from '@/component/PlanUpgrade';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { featureForPath } from '@/utils/planFeatures';

export default function SchoolLayout({ children }) {
  const { user } = useUserStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  // A module outside the school's plan (URL opened directly, or the plan
  // changed meanwhile) shows the upgrade screen instead of a page of 403s.
  const { isEnabled } = usePlanFeatures();

  return (
    // On paper there is no shell: the sidebar and topbar are hidden, and the
    // content pane drops its screen chrome (height cap, scrolling, rounded
    // card, grey background) so the page flows naturally across sheets.
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
        <PlanRouteGuard feature={featureForPath(pathname)} isEnabled={isEnabled}>
          {children}
        </PlanRouteGuard>
      </div>
    </div>
  );
}
