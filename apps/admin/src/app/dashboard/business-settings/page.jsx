'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { BUSINESS_SETTINGS_TABS } from './tabs';

// Which tab is the landing tab depends on the role, and the role is only known
// client-side, so this index route forwards to the first tab the user can open.
export default function BusinessSettingsIndexPage() {
  const router = useRouter();
  const { user } = useUserStore();

  const firstTab = BUSINESS_SETTINGS_TABS.find((t) => t.canAccess(user?.role));

  useEffect(() => {
    if (firstTab) router.replace(firstTab.href);
  }, [firstTab, router]);

  if (firstTab) return null;

  return (
    <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
      You don’t have access to any business settings.
    </div>
  );
}
