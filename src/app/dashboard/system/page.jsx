'use client';

import { useUserStore } from '@/store/userStore';

export default function Dashboard() {
  const { user } = useUserStore();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <p>This is your School dashboard page.</p>
    </div>
  );
}
