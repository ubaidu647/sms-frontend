'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SystemSidebar } from '@/component/SystemSidebar';
import { Topbar } from '@/component/TopBar';

export default function SystemLayout({ children }) {
  const { user, logout, hasHydrated, accessToken, loading, offline } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const signedOut = hasHydrated && !loading && !accessToken && !offline;

  // No session marker and none could be restored from the cookies: end the
  // session through the API, which alone can clear the httpOnly cookies.
  useEffect(() => {
    if (signedOut) logout();
  }, [signedOut, logout]);

  // The token/user stores are persisted in localStorage, so on the server (and
  // on the very first client paint) they are still null. Hold the shell back
  // until rehydration rather than rendering a greeting with no name.
  // API unreachable: logging out would only bounce /signin back here (the
  // session cookie is still there), so say so and let the user retry.
  if (offline) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-sm">
        <p>Can’t reach the server right now.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-teal-600 px-4 py-1.5 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!hasHydrated || loading || signedOut) {
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
