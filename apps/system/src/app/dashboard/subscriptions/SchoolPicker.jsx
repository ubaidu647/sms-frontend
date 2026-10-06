'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { fetchData } from '@/utils/api';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

// Server-searched, paginated school picker. Typing filters by name on the API
// (debounced); "Load more" fetches the next page — no fixed cap on how many
// schools can be reached.
export default function SchoolPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError } =
    useInfiniteQuery({
      queryKey: ['organizations', 'picker', search],
      queryFn: ({ pageParam }) =>
        fetchData({
          url: '/schools',
          page: pageParam,
          limit: PAGE_SIZE,
          columnFilters: search ? [{ id: 'name', value: search }] : [],
        }),
      initialPageParam: 1,
      getNextPageParam: (last, pages) => {
        const loaded = pages.reduce((n, p) => n + (p?.data?.length ?? 0), 0);
        return loaded < (last?.total ?? 0) && (last?.data?.length ?? 0) > 0
          ? pages.length + 1
          : undefined;
      },
      enabled: open,
    });

  const schools = data?.pages.flatMap((p) => p?.data ?? []) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const handleType = (text) => {
    setQuery(text);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSearch(text.trim()), SEARCH_DEBOUNCE_MS);
  };

  const pick = (school) => {
    onChange({ _id: school._id, name: school.name });
    setOpen(false);
    setQuery('');
    setSearch('');
  };

  return (
    <div ref={wrapRef} className="relative w-full sm:max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={open ? query : value?.name || ''}
          placeholder="Search schools by name…"
          onFocus={() => setOpen(true)}
          onChange={(e) => handleType(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          className="w-full pl-9 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {value && !open && (
          <button
            type="button"
            aria-label="Clear school"
            onClick={() => onChange(null)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
          <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
            {isLoading ? (
              <li className="px-4 py-2 text-sm text-gray-500">Loading schools…</li>
            ) : isError ? (
              <li className="px-4 py-2 text-sm text-red-500">Could not load schools.</li>
            ) : schools.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500">
                No schools{search ? ` matching “${search}”` : ''}.
              </li>
            ) : (
              schools.map((s) => (
                <li key={s._id} role="option" aria-selected={s._id === value?._id}>
                  <button
                    type="button"
                    onClick={() => pick(s)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      s._id === value?._id
                        ? 'font-semibold text-teal-700 dark:text-teal-400'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {s.name}
                  </button>
                </li>
              ))
            )}
          </ul>
          {schools.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-2 text-xs text-gray-500">
              <span>
                {schools.length} of {total}
              </span>
              {hasNextPage && (
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                  className="text-teal-600 hover:text-teal-700 disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
