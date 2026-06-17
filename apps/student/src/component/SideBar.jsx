'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  LayoutDashboard,
  Video,
  MessageSquare,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Flat student menu. Mirrors the admin sidebar's look; no role/permission gating.
const navigationItems = [
  { label: 'Dashboard', iconComponent: LayoutDashboard, path: '/dashboard' },
  { label: 'Live Classes', iconComponent: Video, path: '/dashboard/live-classes' },
  { label: 'Live Chat', iconComponent: MessageSquare, path: '/dashboard/chat' },
  { label: 'Live Tests', iconComponent: ClipboardCheck, path: '/dashboard/tests' },
  { label: 'Results', iconComponent: BarChart3, path: '/dashboard/results' },
];

export const Sidebar = ({ isMobileOpen = false, onMobileClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  // Auto-close the mobile drawer when navigating to a new route.
  useEffect(() => {
    if (isMobileOpen && onMobileClose) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Dashboard is exact-match; others highlight on the path or its children.
  const isActive = (itemPath) =>
    itemPath === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === itemPath || pathname.startsWith(itemPath + '/');

  const handleLogout = () => {
    logout();
    router.replace('/signin');
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 80 && newWidth <= 400) {
        setSidebarWidth(newWidth);
        setIsCollapsed(newWidth < 150);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onMobileClose}
        className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px`, height: '100vh' }}
        className={`bg-[#00918e] dark:bg-slate-900 p-4 flex-shrink-0 transition-transform md:transition-none flex flex-col overscroll-contain fixed md:sticky top-0 left-0 z-50 md:self-start ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div
          onMouseDown={startResizing}
          className="hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#00a8a4] dark:hover:bg-slate-700 transition-colors z-50"
        />

        <div className="flex items-center justify-between mb-6">
          {!isCollapsed ? (
            <Link href="/dashboard" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00918e" />
                  <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#00918e" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-xl truncate">Student Portal</h2>
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00918e" />
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#00918e" />
              </svg>
            </Link>
          )}
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setSidebarWidth(isCollapsed ? 240 : 80);
            }}
            className="w-9 h-9 flex items-center justify-center text-white hover:bg-[#00736f] dark:hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 rotate-90" />
            ) : (
              <ChevronUp className="w-5 h-5 -rotate-90" />
            )}
          </button>
        </div>

        <nav className="flex flex-col items-start w-full flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navigationItems.map((item, index) => {
            const itemIsActive = isActive(item.path);
            const Icon = item.iconComponent;
            return (
              <Link
                key={index}
                href={item.path}
                className={`w-full h-14 ${
                  isCollapsed ? 'justify-center px-0' : 'justify-start px-0'
                } rounded-full transition-colors hover:bg-[#00736f] ${
                  itemIsActive ? 'bg-[#00736f]' : 'bg-transparent'
                } flex items-center cursor-pointer no-underline`}
              >
                <div
                  className={`flex items-center gap-2.5 ${isCollapsed ? 'px-3' : 'px-7'} w-full overflow-hidden`}
                >
                  <Icon
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: itemIsActive ? '#FFDC34' : '#ffffff' }}
                  />
                  {!isCollapsed && (
                    <span
                      className={`flex-1 text-left font-medium text-base truncate ${
                        itemIsActive ? 'text-yellow-300' : 'text-white'
                      }`}
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className={`w-full h-14 ${
              isCollapsed ? 'justify-center px-0' : 'justify-start px-0'
            } rounded-full transition-colors hover:bg-[#00736f] dark:hover:bg-slate-800 bg-transparent flex items-center`}
          >
            <div
              className={`flex items-center gap-2.5 ${isCollapsed ? 'px-10' : 'px-7'} overflow-hidden w-full`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-white" />
              {!isCollapsed && (
                <span className="font-medium text-base text-white truncate">Logout</span>
              )}
            </div>
          </button>
        </div>
      </aside>

      {/* Top + right fill bars (match the admin shell) */}
      <div
        className="hidden md:block bg-[#00918e] dark:bg-slate-900 fixed top-0 h-25.5 z-0"
        style={{ left: `${sidebarWidth}px`, right: 0 }}
      />
      <div className="hidden md:block bg-[#00918e] dark:bg-slate-900 fixed top-0 right-0 w-25.5 h-full z-0" />
    </>
  );
};
