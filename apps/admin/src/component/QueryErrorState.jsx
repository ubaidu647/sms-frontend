import React from 'react';
import { AlertCircle } from 'lucide-react';
import { errorMessage, errorStatus } from '@/utils/queryError';

const TITLES = {
  403: "You don't have access to this",
  404: 'Not found',
};

/** Inline error panel for a failed detail query — shows the server message. */
export default function QueryErrorState({ error, fallback = 'Could not load this record' }) {
  const status = errorStatus(error);
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40"
    >
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          {TITLES[status] || fallback}
        </p>
        <p className="text-sm text-red-600 dark:text-red-400 mt-0.5 break-words">
          {errorMessage(error, fallback)}
        </p>
      </div>
    </div>
  );
}
