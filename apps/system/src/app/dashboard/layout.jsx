'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SystemSidebar } from '@/component/SystemSidebar';
import { Topbar } from '@/component/TopBar';

export default function SystemLayout({ children }) {
  const { user, logout, hasHydrated } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // The token/user stores are persisted in localStorage, so on the server (and
  // on the very first client paint) they are still null. Hold the shell back
  // until rehydration rather than rendering a greeting with no name.
  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[rgb(246,246,246)] dark:bg-[#161616]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full md:w-[99%] flex h-screen overflow-hidden">
      <SystemSidebar
        onLogout={logout}
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
