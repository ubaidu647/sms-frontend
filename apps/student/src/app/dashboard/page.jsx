'use client';
import { GraduationCap, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between bg-[#15244a] px-6 py-4 text-white">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#f5b21c]" />
          <span className="font-bold">
            Node<span className="text-[#f5b21c]">Campus</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </header>

      <main className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{user?.name ? `, ${user.name}` : ''} 👋
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your student dashboard is coming soon — live classes, live chat and live tests will appear
          here.
        </p>
      </main>
    </div>
  );
}
