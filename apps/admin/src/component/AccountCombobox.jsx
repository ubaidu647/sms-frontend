'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Searchable Chart of Accounts picker.
 *
 * A native <select> can only be jumped through by first letter, which is
 * useless against a chart of a few hundred heads. This keeps the same shape as
 * the selects around it but filters as you type — on code, name, type and
 * sub-ledger — and stays keyboard-drivable (↑/↓ to move, Enter to pick, Esc to
 * close).
 *
 * `accounts` is a flat list; options are grouped under their account type when
 * `groupByType` is on, mirroring how the chart itself reads.
 */
export default function AccountCombobox({
  accounts = [],
  value,
  onChange,
  placeholder = 'Select account…',
  disabled = false,
  groupByType = true,
  className = '',
  buttonClassName = 'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(() => accounts.find((a) => a._id === value) || null, [accounts, value]);

  const label = (a) => `${a.code} · ${a.name}${a.subLedgerType ? ` (${a.subLedgerType})` : ''}`;

  // Every typed word must appear somewhere in the account, so "cash bank" and
  // "1101 cash" both narrow instead of returning nothing.
  const matches = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return accounts;
    return accounts.filter((a) => {
      const haystack = `${a.code} ${a.name} ${a.type || ''} ${a.subLedgerType || ''}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [accounts, query]);

  // Flat order drives keyboard nav; the grouping below only adds headers.
  const groups = useMemo(() => {
    if (!groupByType) return [{ type: null, accounts: matches }];
    const byType = new Map();
    matches.forEach((a) => {
      const key = a.type || 'other';
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key).push(a);
    });
    return [...byType.entries()].map(([type, list]) => ({ type, accounts: list }));
  }, [matches, groupByType]);

  const ordered = useMemo(() => groups.flatMap((g) => g.accounts), [groups]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Opening starts from a clean search with the current pick highlighted.
  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const idx = ordered.findIndex((a) => a._id === value);
    setHighlight(idx >= 0 ? idx : 0);
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-idx="${highlight}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const pick = (account) => {
    onChange(account?._id || '', account || null);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setHighlight((h) => Math.min(h + 1, ordered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (!open) return;
      e.preventDefault();
      if (ordered[highlight]) pick(ordered[highlight]);
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {open ? (
        <div className={`${buttonClassName} flex items-center gap-2 w-full`}>
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={selected ? label(selected) : 'Search code or name…'}
            className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
          {selected && (
            <button
              type="button"
              onClick={() => pick(null)}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`${buttonClassName} flex items-center justify-between gap-2 w-full text-left disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <span className={`truncate ${selected ? '' : 'text-gray-400'}`}>
            {selected ? label(selected) : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
        </button>
      )}

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
        >
          {!ordered.length ? (
            <div className="px-3 py-3 text-sm text-gray-400">No account matches “{query}”</div>
          ) : (
            groups.map((g) => (
              <div key={g.type || 'all'}>
                {g.type && (
                  <div className="sticky top-0 px-3 py-1 bg-gray-50 dark:bg-gray-800 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {g.type}
                  </div>
                )}
                {g.accounts.map((a) => {
                  const idx = ordered.indexOf(a);
                  const isSelected = a._id === value;
                  return (
                    <button
                      key={a._id}
                      type="button"
                      data-idx={idx}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => pick(a)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${
                        idx === highlight
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {a.code}
                      </span>
                      <span className="truncate">
                        {a.name}
                        {a.subLedgerType && (
                          <span className="text-xs text-gray-400"> ({a.subLedgerType})</span>
                        )}
                      </span>
                      {isSelected && <Check className="w-4 h-4 ml-auto shrink-0 text-teal-600" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
