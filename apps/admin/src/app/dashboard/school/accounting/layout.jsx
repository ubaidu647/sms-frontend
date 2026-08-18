'use client';
import React from 'react';

// No tab strip here — every accounting section (chart of accounts, journals,
// ledger, each report, mapping, periods) is its own sidebar entry, so a page
// shows only its own screen.
export default function AccountingLayout({ children }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800 rounded-[20px]">
      <div className="flex-1 overflow-y-auto scrollbar-hide">{children}</div>
    </div>
  );
}
