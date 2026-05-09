'use client';

import { Sidebar } from '@/component/SideBar';
import { useUserStore } from '@/store/userStore';

export default function SchoolDashboard() {
  const { user } = useUserStore();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center text-black dark:text-gray-100">Welcome, {user?.name}</h1>
      <p className=" text-center text-black dark:text-gray-100">This is your School dashboard page.</p>
    </div>
  );
}
