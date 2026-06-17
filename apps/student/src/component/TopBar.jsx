'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Bell, Settings, LogOut, ChevronDown, Sun, Moon, Menu } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuth } from '@/hooks/useAuth';

export const Topbar = ({ user = {}, onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';
  const { logout } = useAuth();

  useEffect(() => {
    if (!isProfileOpen) return;
    const update = () => {
      if (buttonRef.current) {
        const r = buttonRef.current.getBoundingClientRect();
        setAnchorRect({ top: r.bottom, right: window.innerWidth - r.right });
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (event) => {
      if (buttonRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) {
        return;
      }
      setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    router.replace('/signin');
  };

  return (
    <div className="fixed top-0 left-0 right-0 md:static z-30 bg-[rgb(246,246,246)] dark:bg-[#161616] md:bg-transparent md:dark:bg-transparent h-16 flex items-center justify-between px-3 sm:px-6 gap-2 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 md:border-0">
      {/* Left - mobile menu + greeting */}
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
        )}
        <h1 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">
          Hi, <span className="text-[#00918e] dark:text-[#33b3b0]">{user?.name || 'Student'}</span>
        </h1>
        <span className="text-xl hidden sm:inline">👋</span>
      </div>

      {/* Right - theme, notifications, profile */}
      <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
          title={isDark ? 'Switch to light' : 'Switch to dark'}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          {isDark ? (
            <Sun className="w-6 h-6 text-yellow-300" />
          ) : (
            <Moon className="w-6 h-6 text-gray-600" />
          )}
        </button>

        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button
          ref={buttonRef}
          onClick={() => setIsProfileOpen((v) => !v)}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          <ChevronDown
            className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Profile dropdown (portal) */}
      {isProfileOpen &&
        anchorRect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: Math.min(anchorRect.top + 8, window.innerHeight - 8 - 160),
              right: Math.max(anchorRect.right, 8),
              width: '14rem',
            }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[60]"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {user?.name || 'Student'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role?.name || 'Student'}
              </p>
            </div>

            <div className="mt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Logout</span>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
