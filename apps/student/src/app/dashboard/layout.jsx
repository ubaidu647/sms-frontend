'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { Sidebar } from '@/component/SideBar';
import { Topbar } from '@/component/TopBar';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const hasHydrated = useTokenStore((s) => s.hasHydrated);
  const accessToken = useTokenStore((s) => s.accessToken);
  const refreshToken = useTokenStore((s) => s.refreshToken);
  const user = useUserStore((s) => s.user);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Guard: once the persisted store has hydrated, bounce guests to the login.
  useEffect(() => {
    if (hasHydrated && !accessToken && !refreshToken) {
      router.replace('/signin');
    }
  }, [hasHydrated, accessToken, refreshToken, router]);

  if (!hasHydrated || (!accessToken && !refreshToken)) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full md:w-[99%] flex h-screen overflow-hidden">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />
      <div className="flex-1 min-w-0 bg-[rgb(246,246,246)] dark:bg-[#161616] p-3 sm:p-6 pt-[calc(4rem+0.75rem)] md:pt-6 rounded-none md:!rounded-tl-[50px] md:!rounded-tr-[50px] z-1 md:mt-3 overflow-y-auto md:overflow-hidden flex flex-col">
        <Topbar user={user} onMenuClick={() => setIsMobileOpen(true)} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
