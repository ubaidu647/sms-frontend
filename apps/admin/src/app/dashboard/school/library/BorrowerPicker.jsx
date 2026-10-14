'use client';
// Search-as-you-type borrower picker on the existing /student/list (search)
// and /staff/list (name) endpoints.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import { inputCls } from './libraryShared';

const staffName = (s) => s?.user?.name || s?.userId?.name || s?.name || 'Staff';

function optionOf(type, row) {
  if (type === 'staff') {
    const ref = row.serialNumber || row.user?.serialNumber;
    return {
      id: row._id,
      name: staffName(row),
      detail: [ref, row.designation || row.staffType].filter(Boolean).join(' · '),
    };
  }
  const cls = [row.class?.name, row.section?.name].filter(Boolean).join(' - ');
  return {
    id: row._id,
    name: row.user?.name || row.name || 'Student',
    detail: [row.admissionNumber, cls].filter(Boolean).join(' · '),
  };
}

/** `value` = { id, name, detail } | null; `branchId` narrows the search when set. */
export default function BorrowerPicker({ type, value, onChange, branchId, autoFocus }) {
  const { accessToken: token } = useTokenStore();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const term = search.trim();

  const { data, isFetching } = useQuery({
    queryKey: ['library-borrower-search', type, term, branchId || ''],
    queryFn: () =>
      fetchData({
        url: type === 'staff' ? '/staff/list' : '/student/list',
        page: 1,
        limit: 10,
        token,
        isActive: true,
        ...(type === 'staff' ? { name: term } : { search: term }),
        ...(branchId ? { branchId } : {}),
      }),
    enabled: !!token && term.length >= 2,
    staleTime: 10000,
  });
  const rows = (data?.data || []).map((r) => optionOf(type, r));

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-teal-50 dark:bg-teal-950/40">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {value.name}
          </div>
          {value.detail && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{value.detail}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setOpen(false);
            onChange(null);
          }}
          className="text-xs text-red-600 hover:underline flex-shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        autoFocus={autoFocus}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        placeholder={type === 'staff' ? 'Type staff name…' : 'Type student name or admission #…'}
        className={inputCls}
      />
      {open && term.length >= 2 && rows.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {rows.map((o) => (
            <li
              key={o.id}
              className="px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer text-sm"
              onClick={() => {
                setOpen(false);
                onChange(o);
              }}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{o.name}</div>
              {o.detail && (
                <div className="text-xs text-gray-500 dark:text-gray-400">{o.detail}</div>
              )}
            </li>
          ))}
        </ul>
      )}
      {open && term.length >= 2 && data && !isFetching && rows.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No matches.</p>
      )}
    </div>
  );
}
