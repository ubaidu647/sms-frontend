import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Settings,
  User,
  Users,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

export const Topbar = ({ user = {}, userRole = {} }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  const showUserManagement = ['super-admin', 'admin', 'subadmin'].includes(
    userRole?.name?.toLowerCase(),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-transparent h-16 flex items-center justify-between px-6">
      {/* Left side - User greeting */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Hello, <span className="text-teal-600 dark:text-teal-400">{user.name}</span>
        </h1>
        <span className="text-xl">👋</span>
      </div>

      {/* Right side - Icons and settings */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          {isDark ? (
            <Sun className="w-6 h-6 text-yellow-300" />
          ) : (
            <Moon className="w-6 h-6 text-gray-600" />
          )}
        </button>

        {/* Notification Icon */}
        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Settings Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            <ChevronDown
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole?.name}</p>
              </div>

              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Profile Settings</span>
              </button>

              {showUserManagement && (
                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                  <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">User Management</span>
                </button>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left">
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
