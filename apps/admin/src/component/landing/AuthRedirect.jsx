'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTokenStore } from '@/store/tokenStore';

/**
 * Signed-in visitors belong on their dashboard, not the marketing page.
 * middleware.js already redirects when the session cookie is present; this
 * covers a session held only in the client token store.
 */
export default function AuthRedirect() {
  const router = useRouter();
  const accessToken = useTokenStore((s) => s.accessToken);
  const hasHydrated = useTokenStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated && accessToken) router.replace('/dashboard');
  }, [hasHydrated, accessToken, router]);

  return null;
}
