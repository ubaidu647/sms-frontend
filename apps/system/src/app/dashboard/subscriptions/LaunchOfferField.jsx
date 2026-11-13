'use client';
import React from 'react';
import { fmtMoney } from '../packages/format';
import { offerAvailable, offerSlotsLeft } from '@/utils/launchOffer';

// "Apply launch offer" for signup / assign / change. Shown only while the
// chosen package's offer is on with slots left. `reuseNote`: the school may
// have taken this package's offer before, and the server reuses that lock.
export default function LaunchOfferField({ pkg, apply, onChange, reuseNote = false }) {
  const offer = pkg?.launchOffer;
  const available = offerAvailable(pkg);
  if (!offer || (!available && !reuseNote)) return null;
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
      {available && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-teal-600"
            checked={apply}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Apply launch offer: {fmtMoney(offer.price)} instead of {fmtMoney(pkg.price)}
            </span>
            <span className="block text-xs text-gray-600 dark:text-gray-400">
              Price locked for {offer.lockDays} days, renewals included. {offerSlotsLeft(offer)} of{' '}
              {offer.maxSchools} slots left.
            </span>
          </span>
        </label>
      )}
      {reuseNote && (available ? apply : true) && (
        <p className={`text-xs text-gray-600 dark:text-gray-400 ${available ? 'mt-2' : ''}`}>
          If this school took this package&apos;s launch offer before, its earlier locked price may
          apply instead while that lock lasts.
        </p>
      )}
    </div>
  );
}
