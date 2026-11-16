'use client';

import { useEffect } from 'react';

/**
 * Reveals every `.rv` element as it scrolls into view. Recorded as a
 * `data-in` attribute rather than a class, so React re-rendering an element's
 * className (an FAQ row opening) can never wipe it.
 */
export default function Reveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll('.mz .rv'));
    if (!items.length) return undefined;

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.setAttribute('data-in', ''));
      return undefined;
    }

    const timers = [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          const delay = Number(el.dataset.delay ?? 0);
          timers.push(window.setTimeout(() => el.setAttribute('data-in', ''), delay));
          io.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );

    items.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
