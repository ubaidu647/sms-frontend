'use client';
import { Sidebar } from '@/component/SideBar';
import { Topbar } from '@/component/TopBar';
import { useUserStore } from '@/store/userStore';

export default function SettingsLayout({ children }) {
  const { user } = useUserStore();
  return (
    <div className="w-[99%] flex h-screen overflow-hidden">
      <Sidebar
        user={user}
        menus={user?.role?.menus || []}
        actions={user?.role?.actions || []}
      />
      <div className="flex-1 bg-[rgb(246,246,246)] dark:bg-[#161616] p-6 !rounded-tl-[50px] !rounded-tr-[50px] z-1 mt-3 overflow-hidden flex flex-col">
        <Topbar user={user} userRole={user?.role} />
        <div className="flex-1 overflow-y-auto scroll-smooth">{children}</div>
      </div>
    </div>
  );
}
