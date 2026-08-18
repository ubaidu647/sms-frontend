import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Settings,
  Users,
  Building2,
  CreditCard,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useThemeStore } from '@/store/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { canSee } from '@/utils/permissions';
import { ACTIONS } from '@/constants/rolePermissions';
import { canOpenUserManagement } from '@/app/dashboard/user-management/tabs';
import { canOpenBusinessSettings } from '@/app/dashboard/business-settings/tabs';

// Admin destinations that are not day-to-day school work. Order here is the
// order in the menu: personal preferences, then the org setup, then who may use
// it, then what it costs. `show` decides visibility from the role's grants.
const MENU_ITEMS = [
  { key: 'settings', icon: Settings, href: '/dashboard/settings', show: () => true },
  {
    key: 'businessSettings',
    icon: Building2,
    href: '/dashboard/business-settings',
    show: canOpenBusinessSettings,
  },
  {
    key: 'userManagement',
    icon: Users,
    href: '/dashboard/user-management',
    show: canOpenUserManagement,
  },
  {
    key: 'billing',
    icon: CreditCard,
    href: '/dashboard/billing',
    show: (role) => canSee(role, ACTIONS.VIEW_BILLING),
  },
];

export const Topbar = ({ user = {}, userRole = {}, onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';
  const t = useTranslations('topbar');
  const { logout } = useAuth();

  // Gated on the actual grants, not on role names — a custom role with
  // view-staff or view-role gets in, a role merely named "admin" does not.
  const menuItems = MENU_ITEMS.filter((item) => item.show(userRole));

  // Recompute anchor on open + on scroll/resize so the portal-rendered menu
  // stays glued to the trigger button across viewport changes.
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

  // Close on outside click — the menu lives in a portal so we have to check
  // both the trigger button and the portal node.
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

  return (
    <div className="fixed top-0 left-0 right-0 md:static z-30 bg-[rgb(246,246,246)] dark:bg-[#161616] md:bg-transparent md:dark:bg-transparent h-16 flex items-center justify-between px-3 sm:px-6 gap-2 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 md:border-0 print:hidden">
      {/* Left side - Menu button (mobile) + User greeting */}
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
          {t('greeting')} <span className="text-teal-600 dark:text-teal-400">{user.name}</span>
        </h1>
        <span className="text-xl hidden sm:inline">👋</span>
      </div>

      {/* Right side - Icons and settings */}
      <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? t('switchToLight') : t('switchToDark')}
          title={isDark ? t('switchToLight') : t('switchToDark')}
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

      {/* Dropdown Menu — rendered in a portal so it escapes any ancestor
          overflow-hidden (the dashboard pane uses overflow-hidden on desktop). */}
      {isProfileOpen &&
        anchorRect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: Math.min(anchorRect.top + 8, window.innerHeight - 8 - 220),
              right: Math.max(anchorRect.right, 8),
              width: '14rem',
            }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[60]"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {userRole?.name}
              </p>
            </div>

            {menuItems.map(({ key, icon: Icon, href }) => (
              <button
                key={key}
                onClick={() => {
                  setIsProfileOpen(false);
                  router.push(href);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-200">{t(key)}</span>
              </button>
            ))}

            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">{t('logout')}</span>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
