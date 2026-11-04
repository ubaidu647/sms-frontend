import React from 'react';
import QueryErrorState from '@/component/QueryErrorState';

/** What an Edit modal shows until its record (see useEditRecord) has loaded. */
export default function EditRecordStatus({ query, fallback }) {
  if (query.isError) {
    return (
      <div className="space-y-3">
        <QueryErrorState error={query.error} fallback={fallback} />
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="text-sm font-semibold text-teal-600 hover:underline disabled:opacity-50"
        >
          {query.isFetching ? 'Trying again…' : 'Try again'}
        </button>
      </div>
    );
  }
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Loading">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
