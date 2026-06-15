'use client';
import { useEffect, useState } from 'react';

// Listens for the global `rate-limit` event dispatched by the apiClient
// interceptor on HTTP 429 and exposes a live countdown, so a form can disable its
// submit button until the user is allowed to retry.
//
// `urlIncludes` (optional) scopes the hook to matching request URLs — e.g. the
// sign-in form passes '/auth/' so it only reacts to login/refresh throttling, not
// some unrelated global-throttle 429 happening elsewhere.
//
// NOTE: `retryAfter` comes from the Retry-After header, which browsers can't read
// cross-origin unless the backend exposes it via CORS exposedHeaders. Until that
// lands, it falls back to 900s (15 min), matching the login throttle window.
export function useRateLimit({ urlIncludes } = {}) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    function onRateLimit(e) {
      const { retryAfter = 900, url = '' } = e.detail || {};
      if (urlIncludes && !url.includes(urlIncludes)) return;
      setSecondsLeft(retryAfter);
    }
    window.addEventListener('rate-limit', onRateLimit);
    return () => window.removeEventListener('rate-limit', onRateLimit);
  }, [urlIncludes]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  return { blocked: secondsLeft > 0, secondsLeft };
}
