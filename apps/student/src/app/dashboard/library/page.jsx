'use client';
import { useEffect, useState } from 'react';
import { Library, BookOpen, Search, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLibrary, useLibraryCatalogue } from '@/hooks/useDashboard';
import { PageHeader, Panel } from '@/component/dashboard/Panel';
import { Loading, ErrorState, SeatErrorState, EmptyState } from '@/component/dashboard/States';
import { formatMoney } from '@/utils/format';
import { seatRefusalMessage } from '@/utils/seatRefusal';
import {
  localYMD,
  loanOverdueDays,
  dueLabel,
  formatLibraryDate,
  formatAuthors,
  totalPages as pageCount,
  billedFineCard,
} from '@/utils/library';
import { useSchoolCurrency } from '@/hooks/useSchoolCurrency';

const LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

const BADGE = {
  overdue: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  ok: 'bg-[#00918e]/10 text-[#00918e]',
  muted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  warn: 'bg-[#f5b21c]/15 text-[#b07d00] dark:text-[#f5b21c]',
};

const HISTORY_STATUS = {
  returned: BADGE.ok,
  issued: BADGE.muted,
  lost: BADGE.overdue,
};

const FINE_STATUS_LABEL = {
  pending: 'Pending',
  billed: 'Billed',
  waived: 'Waived',
  paid: 'Paid',
};

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function LibraryPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        icon={Library}
        title="Library"
        subtitle="Your borrowed books, fines and the school catalogue"
      />
      <MyBooks />
      <Catalogue />
    </div>
  );
}

function MyBooks() {
  const { symbol: currencySymbol } = useSchoolCurrency();
  const { data, isLoading, isError, error, refetch } = useLibrary();
  const openLoans = Array.isArray(data?.openLoans) ? data.openLoans : [];
  const history = Array.isArray(data?.history) ? data.history : [];
  const pendingFines = Number(data?.pendingFines) || 0;
  const billed = billedFineCard(data);
  const today = localYMD();

  if (isLoading) return <Loading label="Loading library…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl bg-[#00918e] text-white p-6">
          <p className="text-sm opacity-90">Pending library fine</p>
          <p className="mt-1 text-3xl font-bold">{formatMoney(pendingFines, currencySymbol)}</p>
          <p className="mt-1 text-xs opacity-80">
            {pendingFines > 0 ? 'Will be added to the next fee voucher' : 'No pending fine'}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{billed.label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {formatMoney(billed.amount, currencySymbol)}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{billed.hint}</p>
        </div>
      </div>

      <Panel
        title="Books with you"
        padded={false}
        className="mb-4"
        action={
          openLoans.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {openLoans.length} book{openLoans.length === 1 ? '' : 's'}
            </span>
          )
        }
      >
        {openLoans.length === 0 ? (
          <EmptyState
            title="No books borrowed"
            description="Books issued from the school library will appear here."
            icon={BookOpen}
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {openLoans.map((loan, i) => (
              <OpenLoanRow key={loan._id || loan.accessionNumber || i} loan={loan} today={today} />
            ))}
          </ul>
        )}
      </Panel>

      {history.length > 0 && (
        <Panel title="Recent history" padded={false} className="mb-4">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {history.map((h, i) => (
              <HistoryRow key={h._id || i} item={h} />
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

function OpenLoanRow({ loan, today }) {
  const late = loanOverdueDays(loan, today);
  const authors = formatAuthors(loan.authors);
  return (
    <li className="px-5 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#00918e]/10 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-[#00918e]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {loan.title || 'Untitled'}
          </span>
          {late > 0 ? (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE.overdue}`}>
              Overdue · {late} day{late === 1 ? '' : 's'}
            </span>
          ) : (
            loan.dueDate && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE.ok}`}>
                {dueLabel(loan.dueDate, today)}
              </span>
            )
          )}
        </div>
        {authors && (
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300 truncate">{authors}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {loan.accessionNumber ? `${loan.accessionNumber} · ` : ''}
          Issued {formatLibraryDate(loan.issuedAt)} · Due {formatLibraryDate(loan.dueDate)}
        </p>
      </div>
    </li>
  );
}

function HistoryRow({ item: h }) {
  const { symbol: currencySymbol } = useSchoolCurrency();
  const status = h.status || (h.returnedAt ? 'returned' : 'issued');
  const fineAmount = Number(h.fine?.amount ?? h.fineAmount) || 0;
  const fineStatus = h.fine?.status ?? h.fineStatus;
  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <History className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {h.title || 'Untitled'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {h.accessionNumber ? `${h.accessionNumber} · ` : ''}
          {formatLibraryDate(h.issuedAt)}
          {h.returnedAt ? ` → ${formatLibraryDate(h.returnedAt)}` : ''}
          {fineAmount > 0
            ? ` · Fine ${formatMoney(fineAmount, currencySymbol)}${
                FINE_STATUS_LABEL[fineStatus] ? ` (${FINE_STATUS_LABEL[fineStatus]})` : ''
              }`
            : ''}
        </p>
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
          HISTORY_STATUS[status] || BADGE.muted
        }`}
      >
        {status}
      </span>
    </li>
  );
}

function Catalogue() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  // A new search starts from the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch, isFetching } = useLibraryCatalogue({
    search: debouncedSearch,
    page,
    limit: LIMIT,
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = pageCount(total, LIMIT);
  // Searching cannot change a refusal, so the box goes with it.
  const refused = isError && !!seatRefusalMessage(error);

  return (
    <Panel
      title="Catalogue"
      padded={false}
      action={
        total > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {total} book{total === 1 ? '' : 's'}
          </span>
        )
      }
    >
      <div className={`px-5 pt-4 ${refused ? 'hidden' : ''}`}>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author or ISBN"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] pl-9 pr-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00918e]/40"
          />
        </div>
      </div>

      {isLoading ? (
        <Loading label="Loading catalogue…" />
      ) : isError ? (
        <SeatErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title={debouncedSearch.trim() ? 'No matching books' : 'No books'}
          description={
            debouncedSearch.trim()
              ? 'Try a different title, author or ISBN.'
              : 'The library catalogue is empty.'
          }
          icon={Library}
        />
      ) : (
        <>
          <ul
            className={`mt-3 divide-y divide-gray-100 dark:divide-gray-800 ${
              isFetching ? 'opacity-60 transition-opacity' : ''
            }`}
          >
            {items.map((b, i) => {
              const authors = formatAuthors(b.authors);
              return (
                <li key={b._id || `${b.title}-${i}`} className="px-5 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {b.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {[authors, b.category].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${
                      b.available ? BADGE.ok : BADGE.warn
                    }`}
                  >
                    {b.available ? 'Available' : 'Issued out'}
                  </span>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
