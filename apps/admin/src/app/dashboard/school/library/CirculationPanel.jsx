'use client';
// The librarian's desk: scan/type an accession number or barcode → issue the
// copy if it is on the shelf, or return / renew / mark lost if it is out.
import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ScanLine, BookCheck, RotateCcw, RefreshCw, AlertOctagon, X } from 'lucide-react';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData, postData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { localYMD } from '@/utils/localDate';
import { branchIdOf } from '@/utils/permissions';
import { useTokenStore } from '@/store/tokenStore';
import {
  BORROWER_TYPES,
  COPY_CONDITIONS,
  MAX_RENEWALS,
  defaultDueDate,
  isLoanOverdue,
  limitsFor,
  loanBorrowerId,
  loanBorrowerName,
  normalizeCode,
  overdueDays,
  previewFine,
  validateDueDate,
} from '@/utils/library';
import BorrowerPicker from './BorrowerPicker';
import BorrowerSummary, { useBorrower } from './BorrowerSummary';
import LoanActionModal, { FinePreview, loanOfResponse } from './LoanActionModal';
import {
  CopyStatusBadge,
  FineCell,
  Spinner,
  cardCls,
  dangerBtn,
  errorCls,
  fmtDate,
  inputCls,
  invalidateLibraryCirculation,
  labelCls,
  money,
  primaryBtn,
  secondaryBtn,
  useLibrarySettings,
} from './libraryShared';

/** Lookup payload → { copy, book, loan } whatever the nesting. */
function unpackLookup(d) {
  if (!d) return { copy: null, book: null, loan: null };
  const copy = d.copy || (d.accessionNumber ? d : null);
  const book =
    d.book || (copy?.bookId && typeof copy.bookId === 'object' ? copy.bookId : null) || null;
  const loan =
    d.loan ||
    d.currentLoan ||
    (copy?.currentLoanId && typeof copy.currentLoanId === 'object' ? copy.currentLoanId : null);
  return { copy, book, loan };
}

export default function CirculationPanel() {
  const { accessToken: token } = useTokenStore();
  const inputRef = useRef(null);
  const [raw, setRaw] = useState('');
  const [code, setCode] = useState('');
  const [lastResult, setLastResult] = useState(null); // { kind, title, loan }

  const focusScan = () => setTimeout(() => inputRef.current?.focus(), 0);

  const lookup = useQuery({
    queryKey: ['library-lookup', code],
    queryFn: () => fetchData({ url: '/library/copies/lookup', token, code }),
    enabled: !!token && !!code,
    retry: retryUnless4xx,
  });
  const { copy, book, loan } = unpackLookup(lookup.data?.data);

  const submit = (e) => {
    e.preventDefault();
    const c = normalizeCode(raw);
    if (!c) return;
    setRaw(c);
    if (c === code) lookup.refetch();
    setCode(c);
    setLastResult(null);
  };

  const clear = () => {
    setRaw('');
    setCode('');
    focusScan();
  };

  const onFinished = (result) => {
    setLastResult(result);
    setRaw('');
    setCode('');
    focusScan();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className={cardCls}>
        <label className={labelCls}>Accession number or barcode</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border-2 border-teal-500">
            <ScanLine className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Scan or type, then press Enter (e.g. ACC-000123)"
              className="flex-1 outline-none bg-transparent text-base font-mono text-gray-900 dark:text-gray-100 placeholder:text-gray-400 placeholder:font-sans"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" className={primaryBtn} disabled={!raw.trim()}>
            Look up
          </button>
          {code && (
            <button type="button" className={secondaryBtn} onClick={clear} aria-label="Clear">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {lastResult && <LastResult result={lastResult} onDismiss={() => setLastResult(null)} />}

      {code &&
        (lookup.error ? (
          <QueryErrorState error={lookup.error} fallback={`No copy found for "${code}"`} />
        ) : lookup.isLoading ? (
          <div className={`${cardCls} flex justify-center py-10`}>
            <Spinner />
          </div>
        ) : copy ? (
          <div className="space-y-4">
            <CopyCard copy={copy} book={book} />
            {copy.status === 'available' ? (
              <IssueForm
                key={copy._id}
                copy={copy}
                book={book}
                onIssued={(res) =>
                  onFinished({ kind: 'issued', title: book?.title, loan: loanOfResponse(res) })
                }
              />
            ) : copy.status === 'issued' && loan ? (
              <IssuedLoan
                key={copy._id}
                loan={loan}
                copy={copy}
                book={book}
                onDone={(res, mode) =>
                  onFinished({ kind: mode, title: book?.title, loan: loanOfResponse(res) })
                }
              />
            ) : (
              <div className={`${cardCls} text-sm text-gray-600 dark:text-gray-400`}>
                This copy is <strong>{copy.status}</strong> and cannot be issued. Change its status
                from the book&apos;s detail in the Catalogue.
              </div>
            )}
          </div>
        ) : null)}
    </div>
  );
}

function CopyCard({ copy, book }) {
  const authors = Array.isArray(book?.authors) ? book.authors.join(', ') : book?.authors;
  return (
    <div className={`${cardCls} flex flex-wrap items-start justify-between gap-3`}>
      <div className="min-w-0">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {book?.title || 'Untitled'}
        </div>
        {authors && <div className="text-sm text-gray-600 dark:text-gray-400">{authors}</div>}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-2">
          <span className="font-mono">{copy.accessionNumber}</span>
          {copy.barcode && <span>· Barcode {copy.barcode}</span>}
          {book?.shelf && <span>· Shelf {book.shelf}</span>}
          {copy.condition && <span className="capitalize">· {copy.condition}</span>}
        </div>
      </div>
      <CopyStatusBadge status={copy.status} />
    </div>
  );
}

function IssueForm({ copy, book, onIssued }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const branchId = branchIdOf(copy.branchId || book?.branchId);
  const { settings } = useLibrarySettings(branchId);
  const [type, setType] = useState('student');
  const [borrower, setBorrower] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [dueTouched, setDueTouched] = useState(false);
  const [error, setError] = useState('');
  const b = useBorrower(type, borrower?.id);
  const today = localYMD();

  const loanDays = Number(b.limits?.loanDays) || limitsFor(settings, type).loanDays;
  useEffect(() => {
    if (!dueTouched) setDueDate(defaultDueDate(today, loanDays));
  }, [loanDays, dueTouched, today]);

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/library/loans', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Book issued');
      invalidateLibraryCirculation(queryClient);
      onIssued(res);
    },
    onError: (err) => {
      setError(err.message || 'Could not issue');
      toast.error(err.message || 'Could not issue');
    },
  });

  const issue = () => {
    setError('');
    if (!borrower) return setError(`Pick a ${type}`);
    const dueErr = validateDueDate(dueDate, today);
    if (dueErr) return setError(dueErr);
    mutation.mutate({
      copyId: copy._id,
      borrowerType: type,
      ...(type === 'staff' ? { staffId: borrower.id } : { studentId: borrower.id }),
      dueDate,
    });
  };

  return (
    <div className={`${cardCls} space-y-4`}>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Issue this copy</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Borrower type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setBorrower(null);
              setDueTouched(false);
            }}
            className={`${inputCls} capitalize`}
          >
            {BORROWER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>{type === 'staff' ? 'Staff member' : 'Student'}</label>
          <BorrowerPicker
            key={type}
            type={type}
            value={borrower}
            onChange={(v) => {
              setBorrower(v);
              setDueTouched(false);
            }}
            branchId={branchId}
          />
        </div>
      </div>

      {borrower && <BorrowerSummary type={type} id={borrower.id} />}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={labelCls}>Due date</label>
          <input
            type="date"
            value={dueDate}
            min={defaultDueDate(today, 1)}
            max={defaultDueDate(today, 90)}
            onChange={(e) => {
              setDueDate(e.target.value);
              setDueTouched(true);
            }}
            className={inputCls}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 pb-2">
          Default {loanDays} day(s) for {type}s
        </span>
        <button
          type="button"
          className={`${primaryBtn} ml-auto`}
          onClick={issue}
          disabled={mutation.isPending || !borrower}
        >
          <BookCheck className="w-4 h-4" />
          {mutation.isPending ? 'Issuing…' : 'Issue'}
        </button>
      </div>
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

function IssuedLoan({ loan: rawLoan, copy, book, onDone }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const loan = {
    ...rawLoan,
    branchId: rawLoan.branchId || copy.branchId,
    book: rawLoan.book || book,
    copy: rawLoan.copy || copy,
  };
  const { settings } = useLibrarySettings(branchIdOf(loan.branchId));
  const today = localYMD();
  const [returnedAt, setReturnedAt] = useState(today);
  const [condition, setCondition] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const borrowerId = loanBorrowerId(loan);
  const b = useBorrower(loan.borrowerType, borrowerId);
  const name = b.borrower?.name || loanBorrowerName(loan);
  const od = overdueDays(loan.dueDate);
  const fine = previewFine({ dueDate: loan.dueDate, returnedAt, settings });
  const canRenew = !isLoanOverdue(loan) && (Number(loan.renewals) || 0) < MAX_RENEWALS;

  const returnMutation = useMutation({
    mutationFn: (payload) =>
      patchData({ url: `/library/loans/${loan._id}/return`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Book returned');
      invalidateLibraryCirculation(queryClient);
      onDone(res, 'return');
    },
    onError: (err) => {
      setError(err.message || 'Could not return');
      toast.error(err.message || 'Could not return');
    },
  });

  const doReturn = () => {
    setError('');
    if (!returnedAt || returnedAt > today) return setError('Pick a return date up to today');
    returnMutation.mutate({ returnedAt, ...(condition ? { condition } : {}) });
  };

  return (
    <div className={`${cardCls} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase font-semibold text-gray-500">Issued to</div>
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {name} <span className="text-sm font-normal capitalize">({loan.borrowerType})</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Issued {fmtDate(loan.issuedAt)} · Due {fmtDate(loan.dueDate)} · Renewals{' '}
            {Number(loan.renewals) || 0}/{MAX_RENEWALS}
          </div>
          {od > 0 && (
            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
              {od} day(s) overdue
            </div>
          )}
        </div>
      </div>

      {borrowerId && <BorrowerSummary type={loan.borrowerType} id={borrowerId} />}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={labelCls}>Return date</label>
            <input
              type="date"
              value={returnedAt}
              max={today}
              onChange={(e) => setReturnedAt(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={`${inputCls} capitalize`}
            >
              <option value="">Unchanged</option>
              {COPY_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={primaryBtn}
            onClick={doReturn}
            disabled={returnMutation.isPending}
          >
            <RotateCcw className="w-4 h-4" />
            {returnMutation.isPending ? 'Returning…' : 'Return'}
          </button>
          <button
            type="button"
            className={secondaryBtn}
            onClick={() => setModal('renew')}
            disabled={!canRenew}
            title={canRenew ? '' : 'Overdue loans and loans renewed twice cannot be renewed'}
          >
            <RefreshCw className="w-4 h-4" />
            Renew
          </button>
          <button type="button" className={dangerBtn} onClick={() => setModal('lost')}>
            <AlertOctagon className="w-4 h-4" />
            Mark lost
          </button>
        </div>
        <FinePreview fine={fine} settings={settings} />
        {error && <p className={errorCls}>{error}</p>}
      </div>

      {modal && (
        <LoanActionModal
          mode={modal}
          loan={{ ...loan, ...(name ? { borrowerName: name } : {}) }}
          onClose={() => setModal(null)}
          onDone={onDone}
        />
      )}
    </div>
  );
}

function LastResult({ result, onDismiss }) {
  const { kind, title, loan } = result;
  const verb =
    { issued: 'Issued', return: 'Returned', renew: 'Renewed', lost: 'Marked lost' }[kind] || 'Done';
  const fineAmount = Number(loan?.fine?.amount) || 0;
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/40 text-sm text-teal-900 dark:text-teal-200">
      <div className="flex-1 space-y-1">
        <div>
          <strong>{verb}</strong>: {title || 'book'}
          {loan?.dueDate && (kind === 'issued' || kind === 'renew') && (
            <> — due {fmtDate(loan.dueDate)}</>
          )}
        </div>
        {(kind === 'return' || kind === 'lost') && (
          <div className="flex items-center gap-2">
            {fineAmount > 0 ? (
              <>
                Fine charged{loan?.fine?.days ? ` (${loan.fine.days} day(s) late)` : ''}:
                <FineCell fine={loan.fine} />
                {loan?.borrowerType === 'student' && (
                  <span className="text-xs">— added to the next fee voucher</span>
                )}
              </>
            ) : (
              <span>No fine — {money(0)}</span>
            )}
          </div>
        )}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
