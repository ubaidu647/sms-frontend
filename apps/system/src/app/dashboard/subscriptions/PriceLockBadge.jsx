'use client';
import React from 'react';
import { fmtMoney, fmtDate } from '../packages/format';
import { livePriceLock } from '@/utils/launchOffer';

// "Launch offer Rs 3,500 until 12 Nov 2027" while the subscription's price
// lock runs; "ended" once it has passed (the next renewal is at full price).
export default function PriceLockBadge({ sub }) {
  const lock = sub?.priceLock;
  if (!lock || lock.price == null) return null;
  const live = !!livePriceLock(sub);
  return (
    <span
      title={
        live
          ? 'Renewals keep this price until the date shown.'
          : 'The launch price has ended: the next renewal is at the normal price.'
      }
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
        live
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      Launch offer {fmtMoney(lock.price)} {live ? 'until' : 'ended'} {fmtDate(lock.until)}
    </span>
  );
}
