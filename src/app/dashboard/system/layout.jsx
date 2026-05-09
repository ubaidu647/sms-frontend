'use client';
import { useAuth } from '@/hooks/useAuth';
import { SystemSidebar } from '@/component/SystemSidebar';
import { Topbar } from '@/component/TopBar';

export default function SystemLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="w-[99%] flex min-h-screen">
      <SystemSidebar onLogout={logout} />
      <div className="flex-1 bg-[rgb(246,246,246)] dark:bg-[#161616] p-6 !rounded-tl-[50px] !rounded-tr-[50px] z-1 mt-3">
        <Topbar user={user} userRole={user?.role} />
        {children}
      </div>
    </div>
  );
}
