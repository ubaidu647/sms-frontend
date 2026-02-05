import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, User, Users, LogOut, ChevronDown } from 'lucide-react';

export const Topbar = ({ user = {}, userRole = {} }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        <h1 className="text-xl font-semibold text-gray-800">
          Hello, <span className="text-teal-600">{user.name}</span>
        </h1>
        <span className="text-xl">👋</span>
      </div>

      {/* Right side - Icons and settings */}
      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-6 h-6 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Settings Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-6 h-6 text-gray-600" />
            <ChevronDown
              className={`w-4 h-4 text-gray-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole?.name}</p>
              </div>

              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Profile Settings</span>
              </button>

              {showUserManagement && (
                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">User Management</span>
                </button>
              )}

              <div className="border-t border-gray-200 mt-2 pt-2">
                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left">
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
