import React from 'react';
import { errorMessage } from '@/utils/queryError';

/**
 * Why a picker came back empty. A failed lookup is not "no matches": a 403
 * carries the server's message naming the missing permission.
 */
export default function PickerError({ error, fallback = 'Could not load the options' }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">
      {errorMessage(error, fallback)}
    </p>
  );
}
