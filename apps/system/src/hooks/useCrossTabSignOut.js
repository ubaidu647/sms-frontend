'use client';
import { useEffect } from 'react';
import { isCrossTabSignOut } from '@/utils/session';

// Logging out in one tab must end the session in the others too. A hard
// navigation, so no data held in this tab's memory survives.
export function useCrossTabSignOut() {
  useEffect(() => {
    const onStorage = (event) => {
      if (isCrossTabSignOut(event)) window.location.replace('/signin');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}
