'use client';
import { AlertTriangle } from 'lucide-react';

// Amber notice for the `warnings` the promotion API returns beside a preview,
// run, run list or section roster (things it could not check or do itself).
export default function WarningsNotice({ warnings, title = 'Warnings' }) {
  if (!warnings?.length) return null;
  return (
    <div
      role="status"
      className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
        <AlertTriangle className="w-4 h-4" />
        {title}
      </div>
      <ul className="list-disc ps-6 space-y-1 text-sm text-amber-800 dark:text-amber-300">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
