'use client';
import React from 'react';
import { storageUsage } from '@/utils/storage';

// Upload storage: used / limit with a bar; "Unlimited" when the plan has no limit.
export default function StorageUsage({ storage, className = '' }) {
  const u = storageUsage(storage);
  if (!u) return null;
  const bar = u.full ? 'bg-red-600' : u.warn ? 'bg-amber-500' : 'bg-teal-600';
  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm ${className}`}
    >
      <div className="flex flex-wrap justify-between gap-2">
        <span className="font-medium text-gray-700 dark:text-gray-300">Storage</span>
        <span
          className={
            u.warn ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
          }
        >
          {u.usedText} of {u.limitText} used{u.unlimited ? '' : ` (${u.percent}%)`}
        </span>
      </div>
      {!u.unlimited && (
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
          role="progressbar"
          aria-label="Storage used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={u.percent}
        >
          <div className={`h-full ${bar}`} style={{ width: `${u.percent}%` }} />
        </div>
      )}
      {u.full && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Storage is full: uploads are refused until files are deleted or storage is added.
        </p>
      )}
    </div>
  );
}
