'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCrossTabSignOut } from '@/hooks/useCrossTabSignOut';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useUserStore } from '@/store/userStore';
import { Loader2 } from 'lucide-react';
import SubscriptionGuard from '@/component/SubscriptionGuard';
import ForcedPasswordChange from '@/component/ForcedPasswordChange';

// Where a forced password change happens (middleware lets every role in).
const PASSWORD_PATH = '/dashboard/settings/password';

export default function DashboardLayout({ children }) {
  useCrossTabSignOut();
  const { hasHydrated, accessToken, loading, logout, offline } = useAuth();
  const signedOut = hasHydrated && !loading && !accessToken && !offline;
  const { user } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = hasHydrated && !loading && !!accessToken;
  // The API refuses everything but change-password until it is done, so the
  // dashboard (and its data loading) waits behind that page.
  const mustChangePassword = signedIn && user?.mustChangePassword === true;
  // The school's academic year start month must be known before any page
  // works out "the current academic year" for its defaults. Keyed by the real
  // user id — a placeholder key would defeat the wrong-user guard in
  // useSchoolSettings. No id (the /auth/me fetch failed) → no request, and the
  // dashboard renders with the remembered/default month.
  const userId = user?._id || user?.id;
  const { ready: settingsReady } = useSchoolSettings(
    signedIn && !mustChangePassword && userId ? String(userId) : null,
  );

  useEffect(() => {
    if (mustChangePassword && pathname !== PASSWORD_PATH) router.replace(PASSWORD_PATH);
  }, [mustChangePassword, pathname, router]);

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

  if (!hasHydrated || loading || signedOut || !settingsReady) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  if (mustChangePassword) return <ForcedPasswordChange onLogout={logout} />;

  return <SubscriptionGuard>{children}</SubscriptionGuard>;
}
