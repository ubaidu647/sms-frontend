'use client';
// One title with its copies: add copies (auto or manual accession numbers),
// edit a copy's condition / status / barcode, withdraw a copy.
import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Archive } from 'lucide-react';
import { Modal } from '@/component/Modal';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData, postData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { useTokenStore } from '@/store/tokenStore';
import { COPY_CONDITIONS, MAX_COPIES_PER_REQUEST, normalizeCode, splitList } from '@/utils/library';
import ConfirmModal from './ConfirmModal';
import {
  CopyStatusBadge,
  Spinner,
  cardCls,
  errorCls,
  inputCls,
  invalidateLibraryCatalogue,
  labelCls,
  primaryBtn,
  tdCls,
  thCls,
} from './libraryShared';

export default function BookDetailModal({ bookId, onClose, canManage }) {
  const { accessToken: token } = useTokenStore();
  const [editCopy, setEditCopy] = useState(null);
  const [withdrawCopy, setWithdrawCopy] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['library-book', bookId],
    queryFn: () => fetchData({ url: `/library/books/${bookId}`, token }),
    enabled: !!token && !!bookId,
    retry: retryUnless4xx,
  });
  const d = data?.data || {};
  const book = d.book || d;
  const copies = d.copies || book?.copies || [];
  const authors = Array.isArray(book?.authors) ? book.authors.join(', ') : book?.authors;

  return (
    <>
      <Modal
        isOpen={!!bookId}
        onClose={onClose}
        title={book?.title || 'Book'}
        subtitle={authors}
        size="xl"
      >
        {error ? (
          <QueryErrorState error={error} fallback="Could not load the book" />
        ) : isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                ['ISBN', book.isbn],
                ['Publisher', book.publisher],
                ['Edition', book.edition],
                ['Year', book.year],
                ['Category', book.category],
                ['Language', book.language],
                ['Shelf', book.shelf],
                ['Tags', Array.isArray(book.tags) ? book.tags.join(', ') : ''],
                [
                  'Copies',
                  `${book.copiesAvailable ?? copies.filter((c) => c.status === 'available').length} available / ${book.copiesTotal ?? copies.length}`,
                ],
                ['Status', book.isActive === false ? 'Inactive' : 'Active'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {k}
                  </dt>
                  <dd className="text-gray-900 dark:text-gray-100">{v || '—'}</dd>
                </div>
              ))}
            </dl>

            {canManage && <AddCopies bookId={bookId} />}

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className={thCls}>Accession #</th>
                    <th className={thCls}>Barcode</th>
                    <th className={thCls}>Condition</th>
                    <th className={thCls}>Status</th>
                    {canManage && <th className={thCls} />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {copies.length === 0 && (
                    <tr>
                      <td className={`${tdCls} text-center text-gray-500`} colSpan={5}>
                        No copies yet.
                      </td>
                    </tr>
                  )}
                  {copies.map((c) => {
                    const locked = c.status === 'issued';
                    return (
                      <tr key={c._id}>
                        <td className={`${tdCls} font-mono`}>{c.accessionNumber}</td>
                        <td className={`${tdCls} font-mono`}>{c.barcode || '—'}</td>
                        <td className={`${tdCls} capitalize`}>{c.condition || '—'}</td>
                        <td className={tdCls}>
                          <CopyStatusBadge status={c.status} />
                        </td>
                        {canManage && (
                          <td className={`${tdCls} text-right whitespace-nowrap`}>
                            <button
                              type="button"
                              className="p-1.5 text-gray-500 hover:text-teal-600 disabled:opacity-40"
                              disabled={locked}
                              title={locked ? 'Return the copy before editing it' : 'Edit copy'}
                              onClick={() => setEditCopy(c)}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-40"
                              disabled={locked || c.status === 'withdrawn'}
                              title="Withdraw copy"
                              onClick={() => setWithdrawCopy(c)}
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
      {editCopy && <EditCopyModal copy={editCopy} onClose={() => setEditCopy(null)} />}
      {withdrawCopy && (
        <WithdrawCopyModal copy={withdrawCopy} onClose={() => setWithdrawCopy(null)} />
      )}
    </>
  );
}

function AddCopies({ bookId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('auto');
  const [count, setCount] = useState('1');
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  // The disabled button only lands on the next render; a fast second click can
  // beat it, and every add mints new accession numbers.
  const inFlight = useRef(false);

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: `/library/books/${bookId}/copies`, payload, token }),
    onSettled: () => {
      inFlight.current = false;
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Copies added');
      invalidateLibraryCatalogue(queryClient);
      setCount('1');
      setManual('');
    },
    onError: (err) => {
      setError(err.message || 'Could not add copies');
      toast.error(err.message || 'Could not add copies');
    },
  });

  const send = (payload) => {
    inFlight.current = true;
    mutation.mutate(payload);
  };

  const submit = () => {
    if (inFlight.current || mutation.isPending) return;
    setError('');
    if (mode === 'auto') {
      const n = Number(count);
      if (!Number.isInteger(n) || n < 1 || n > MAX_COPIES_PER_REQUEST)
        return setError(`Enter 1–${MAX_COPIES_PER_REQUEST} copies`);
      return send({ count: n });
    }
    const list = splitList(manual).map(normalizeCode).filter(Boolean);
    if (!list.length) return setError('Enter at least one accession number');
    return send({ accessionNumbers: [...new Set(list)] });
  };

  return (
    <div className={`${cardCls} space-y-3`}>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={labelCls}>Add copies</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
            <option value="auto">Automatic accession numbers</option>
            <option value="manual">Manual accession numbers</option>
          </select>
        </div>
        {mode === 'auto' ? (
          <div className="w-28">
            <label className={labelCls}>How many</label>
            <input
              type="number"
              min="1"
              max={MAX_COPIES_PER_REQUEST}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className={inputCls}
            />
          </div>
        ) : (
          <div className="flex-1 min-w-[220px]">
            <label className={labelCls}>Accession numbers (comma or one per line)</label>
            <textarea
              rows={2}
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
        )}
        <button type="button" className={primaryBtn} onClick={submit} disabled={mutation.isPending}>
          <Plus className="w-4 h-4" />
          {mutation.isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

function useCopyMutation(copyId, onClose, done) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (payload) => patchData({ url: `/library/copies/${copyId}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || done);
      invalidateLibraryCatalogue(queryClient);
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Could not update the copy');
      toast.error(err.message || 'Could not update the copy');
    },
  });
  return { mutation, error, setError };
}

function EditCopyModal({ copy, onClose }) {
  const [condition, setCondition] = useState(
    COPY_CONDITIONS.includes(copy.condition) ? copy.condition : 'good',
  );
  const [status, setStatus] = useState(copy.status === 'withdrawn' ? 'withdrawn' : 'available');
  const [barcode, setBarcode] = useState(copy.barcode || '');
  const { mutation, error } = useCopyMutation(copy._id, onClose, 'Copy updated');
  const statusEditable = copy.status === 'available' || copy.status === 'withdrawn';

  return (
    <ConfirmModal
      isOpen
      onClose={onClose}
      title={`Edit copy ${copy.accessionNumber}`}
      confirmLabel="Save"
      cancelLabel="Close"
      loading={mutation.isPending}
      onConfirm={() =>
        mutation.mutate({
          condition,
          ...(statusEditable ? { status } : {}),
          barcode: normalizeCode(barcode),
        })
      }
    >
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className={`${inputCls} capitalize`}
          >
            {COPY_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {statusEditable && (
          <div>
            <label className={labelCls}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="available">Available</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>Barcode</label>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className={`${inputCls} font-mono`}
            placeholder="Scan or type"
          />
        </div>
        {error && <p className={errorCls}>{error}</p>}
      </div>
    </ConfirmModal>
  );
}

function WithdrawCopyModal({ copy, onClose }) {
  const { mutation, error } = useCopyMutation(copy._id, onClose, 'Copy withdrawn');
  return (
    <ConfirmModal
      isOpen
      onClose={onClose}
      title="Withdraw copy"
      message={`Withdraw ${copy.accessionNumber} from circulation? It can no longer be issued.`}
      confirmLabel="Withdraw"
      confirmTone="danger"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate({ status: 'withdrawn' })}
    >
      {error && <p className={errorCls}>{error}</p>}
    </ConfirmModal>
  );
}
