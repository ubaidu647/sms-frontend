'use client';
// Add / edit a catalogue title. On create the librarian may also ask for N
// copies (auto accession numbers).
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { postData, putData } from '@/utils/api';
import { branchIdOf } from '@/utils/permissions';
import { useTokenStore } from '@/store/tokenStore';
import { buildBookPayload } from '@/utils/library';
import { BranchSelect } from '../leave/LeavePickers';
import { errorCls, inputCls, invalidateLibraryCatalogue, labelCls } from './libraryShared';

const optionalYear = yup
  .string()
  .trim()
  .test('year', 'Enter a 4-digit year', (v) => !v || /^\d{4}$/.test(v));

const makeSchema = ({ isCreate, needBranch }) =>
  yup.object().shape({
    branchId:
      isCreate && needBranch ? yup.string().required('Pick a branch') : yup.string().nullable(),
    title: yup.string().trim().required('Title is required').max(300),
    authors: yup.string().trim().max(500),
    isbn: yup.string().trim().max(20),
    publisher: yup.string().trim().max(200),
    edition: yup.string().trim().max(50),
    year: optionalYear,
    category: yup.string().trim().max(100),
    language: yup.string().trim().max(50),
    shelf: yup.string().trim().max(50),
    tags: yup.string().trim().max(300),
    copies: isCreate
      ? yup
          .string()
          .test(
            'copies',
            'Copies must be a whole number from 0 to 500',
            (v) => !v || (/^\d+$/.test(v) && Number(v) <= 500),
          )
      : yup.string().nullable(),
  });

const toForm = (book, branchId) => ({
  branchId: branchIdOf(book?.branchId) || branchId || '',
  title: book?.title || '',
  authors: Array.isArray(book?.authors) ? book.authors.join(', ') : book?.authors || '',
  isbn: book?.isbn || '',
  publisher: book?.publisher || '',
  edition: book?.edition || '',
  year: book?.year ? String(book.year) : '',
  category: book?.category || '',
  language: book?.language || '',
  shelf: book?.shelf || '',
  tags: Array.isArray(book?.tags) ? book.tags.join(', ') : '',
  copies: book ? '' : '1',
});

/** `book` = null → create. `orgTier` shows the branch picker on create. */
export default function BookFormModal({ isOpen, onClose, book, orgTier, defaultBranchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const isCreate = !book;
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(makeSchema({ isCreate, needBranch: orgTier })),
    defaultValues: toForm(book, defaultBranchId),
  });

  useEffect(() => {
    if (isOpen) {
      reset(toForm(book, defaultBranchId));
      setSubmitError('');
    }
  }, [isOpen, book, defaultBranchId, reset]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isCreate
        ? postData({ url: '/library/books', payload, token })
        : putData({ url: `/library/books/${book._id}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isCreate ? 'Book added' : 'Book updated'));
      invalidateLibraryCatalogue(queryClient);
      onClose();
    },
    onError: (err) => {
      setSubmitError(err.message || 'Could not save the book');
      toast.error(err.message || 'Could not save the book');
    },
  });

  const onSubmit = (values) => {
    setSubmitError('');
    mutation.mutate(
      buildBookPayload({ ...values, branchId: orgTier ? values.branchId : '' }, { isCreate }),
    );
  };

  const field = (name, label, props = {}) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input {...register(name)} className={inputCls} {...props} />
      {errors[name] && <p className={errorCls}>{errors[name].message}</p>}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'Add book' : 'Edit book'}
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button
            label="Cancel"
            handleClick={onClose}
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label={isCreate ? 'Add book' : 'Save'}
            loading={mutation.isPending}
            handleClick={handleSubmit(onSubmit)}
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isCreate && orgTier && (
          <div>
            <label className={labelCls}>Branch</label>
            <BranchSelect
              value={watch('branchId') || ''}
              onChange={(v) => setValue('branchId', v, { shouldValidate: true })}
              allLabel="Select branch…"
            />
            {errors.branchId && <p className={errorCls}>{errors.branchId.message}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">{field('title', 'Title *')}</div>
          <div className="sm:col-span-2">
            {field('authors', 'Authors (comma separated)', { placeholder: 'e.g. A. Khan, B. Ali' })}
          </div>
          {field('isbn', 'ISBN')}
          {field('publisher', 'Publisher')}
          {field('edition', 'Edition')}
          {field('year', 'Year', { inputMode: 'numeric', placeholder: 'YYYY' })}
          {field('category', 'Category', { placeholder: 'e.g. Science, Fiction' })}
          {field('language', 'Language')}
          {field('shelf', 'Shelf / location')}
          {field('tags', 'Tags (comma separated)')}
          {isCreate &&
            field('copies', 'Number of copies', {
              type: 'number',
              min: 0,
              max: 500,
              step: 1,
            })}
        </div>
        {isCreate && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Copies get automatic accession numbers (ACC-000001…). Add more or manual numbers later
            from the book&apos;s detail.
          </p>
        )}
        {submitError && <p className={errorCls}>{submitError}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
