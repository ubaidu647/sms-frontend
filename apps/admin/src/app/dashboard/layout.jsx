'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import SubscriptionGuard from '@/component/SubscriptionGuard';

export default function DashboardLayout({ children }) {
  const { hasHydrated, accessToken, loading, logout, offline } = useAuth();
  const signedOut = hasHydrated && !loading && !accessToken && !offline;

  // No session marker and none could be restored from the cookies. End the
  // session through the API — only it can clear the httpOnly cookies, and while
  // `sms_at` exists middleware.js would bounce /signin straight back here.
  useEffect(() => {
    if (signedOut) logout();
  }, [signedOut, logout]);

  // API unreachable: logging out would only bounce /signin back here (the
  // session cookie is still there), so say so and let the user retry.
  if (offline) {
    return (
      <div className="h-screen flex flex-col gap-3 justify-center items-center text-sm">
        <p>Can’t reach the server right now.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-1.5 rounded-lg bg-teal-600 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!hasHydrated || loading || signedOut) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return <SubscriptionGuard>{children}</SubscriptionGuard>;
}
