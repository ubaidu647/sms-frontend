'use client';

import { Sidebar } from '@/component/SideBar';
import { useUserStore } from '@/store/userStore';

export default function Dashboard() {
  const { user } = useUserStore();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center text-black">Welcome, {user?.name}</h1>
      <p className=" text-center text-black">This is your School dashboard page.</p>
    </div>
  );
}
