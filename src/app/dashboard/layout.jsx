'use client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { hasHydrated, accessToken, refreshToken, loading } = useAuth();

  if (!hasHydrated || loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  if (!accessToken && !refreshToken) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return <>{children}</>;
}
