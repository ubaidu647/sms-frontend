'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { Sidebar } from '@/component/SideBar';
import { Topbar } from '@/component/TopBar';
import { PlanRouteGuard, PlanUpgradeModal } from '@/component/PlanUpgrade';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { featureForPath } from '@/utils/planFeatures';
import { BUSINESS_SETTINGS_TABS } from './tabs';

export default function BusinessSettingsLayout({ children }) {
  const { user } = useUserStore();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const tPlan = useTranslations('planFeatures');
  const { isEnabled, gate } = usePlanFeatures();
  const [lockedFeature, setLockedFeature] = useState(null);

  // Permission first, then the plan: a tab of an out-of-plan module (WhatsApp)
  // is locked or hidden per the school's setting.
  const visibleTabs = BUSINESS_SETTINGS_TABS.filter(
    (t) => t.canAccess(user?.role) && gate(t.feature) !== 'hide',
  );

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
              const active = tab.isActive
                ? tab.isActive(pathname)
                : pathname === tab.href || pathname.startsWith(tab.href + '/');
              const Icon = tab.icon;
              const locked = gate(tab.feature) === 'lock';
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={(e) => {
                    if (!locked) return;
                    e.preventDefault();
                    setLockedFeature(tab.feature);
                  }}
                  aria-disabled={locked || undefined}
                  title={locked ? tPlan('locked') : undefined}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap no-underline ${
                    locked ? 'opacity-60' : ''
                  } ${
                    active
                      ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.labelKey ? tPlan(tab.labelKey) : tab.label}
                  {locked && <Lock className="w-3.5 h-3.5" aria-label={tPlan('locked')} />}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 md:overflow-hidden flex flex-col mt-3">
          <PlanRouteGuard feature={featureForPath(pathname)} isEnabled={isEnabled}>
            {children}
          </PlanRouteGuard>
        </div>
        <PlanUpgradeModal
          isOpen={!!lockedFeature}
          feature={lockedFeature}
          onClose={() => setLockedFeature(null)}
        />
      </div>
    </div>
  );
}
