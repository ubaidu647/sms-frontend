import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const systemNavItems = [
  {
    label: 'Dashboard',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/bold.svg',
    key: 'dashboard',
    path: '/dashboard/system',
  },
  {
    label: 'Organizations',
    icon: 'https://c.animaapp.com/mi4xjeskxZrnLa/img/frame-1.svg',
    key: 'organizations',
    path: '/dashboard/system/organizations',
  },
];

export const SystemSidebar = ({ onLogout, isMobileOpen = false, onMobileClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const pathname = usePathname();

  // Auto-close the mobile drawer on route change.
  useEffect(() => {
    if (isMobileOpen && onMobileClose) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
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
        style={{ width: `${sidebarWidth}px` }}
        className={`bg-teal-600 dark:bg-slate-900 h-screen md:min-h-screen p-4 flex-shrink-0 transition-transform md:transition-none flex flex-col fixed md:relative top-0 left-0 z-50 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div
          onMouseDown={startResizing}
          className="hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-teal-500 dark:hover:bg-slate-700 transition-colors z-50"
        />

        <div className="flex items-center justify-between mb-6">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00918e" />
                  <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#00918e" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-xl truncate">System</h2>
            </div>
          ) : (
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00918e" />
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#00918e" />
              </svg>
            </div>
          )}
          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setSidebarWidth(isCollapsed ? 240 : 80);
            }}
            className="w-9 h-9 flex items-center justify-center text-white hover:bg-teal-700 dark:hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 rotate-90" />
            ) : (
              <ChevronUp className="w-5 h-5 -rotate-90" />
            )}
          </button>
        </div>

        <nav className="flex flex-col items-start w-full flex-1 overflow-y-auto overflow-x-hidden">
          {systemNavItems.map((item, index) => {
            const itemIsActive = pathname === item.path;
            return (
              <Link href={item.path} key={index} className="w-full">
                <button
                  className={`w-full h-14 rounded-full transition-colors hover:bg-teal-700 dark:hover:bg-slate-800 flex items-center ${
                    itemIsActive ? 'bg-teal-700 dark:bg-slate-800' : 'bg-transparent'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2.5 ${isCollapsed ? 'px-3' : 'px-7'} w-full overflow-hidden`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-5 h-5 flex-shrink-0" alt={item.label} src={item.icon} />
                    {!isCollapsed && (
                      <span
                        className={`flex-1 text-left font-medium text-base truncate ${
                          itemIsActive ? 'text-yellow-300' : 'text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/20">
          <button
            onClick={onLogout}
            className={`w-full h-14 rounded-full transition-colors hover:bg-teal-700 dark:hover:bg-slate-800 bg-transparent flex items-center`}
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

      <div
        className="hidden md:block bg-teal-600 dark:bg-slate-900 fixed top-0 h-25.5 z-0"
        style={{ left: `${sidebarWidth}px`, right: 0 }}
      />
      <div className="hidden md:block bg-teal-600 dark:bg-slate-900 fixed top-0 right-0 w-25.5 h-full z-0" />
    </>
  );
};
