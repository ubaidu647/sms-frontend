'use client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/component/SideBar';
import { Topbar } from '@/component/TopBar';

export default function DashboardLayout({ children }) {
  const { hasHydrated, accessToken, refreshToken, loading, user } = useAuth();

  if (!hasHydrated || loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10"> </Loader2>
      </div>
    ); // prevents flash
  }

  // 🔒 Extra safety: If both tokens are gone, don’t render
  if (!accessToken && !refreshToken) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10"> </Loader2>
      </div>
    ); // prevents flash
  }
  // Render children if authenticated or on signin page
  return (
    <div className="w-[99%] flex min-h-screen">
      {/* Sidebar on the left */}
      <Sidebar user={user} actionList={user?.role?.actions} />
      {console.log('user', user)}
      {/* Main page content */}
      <div className=" flex-1 bg-[rgb(246,246,246)] p-6 bg-white-500 !rounded-tl-[50px] !rounded-tr-[50px] z-1 mt-3">
        <Topbar user={user} userRole={user?.role}></Topbar>

        {children}
      </div>
    </div>
  );
}
