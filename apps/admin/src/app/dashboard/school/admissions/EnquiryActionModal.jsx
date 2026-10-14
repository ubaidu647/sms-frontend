'use client';
// Follow-up / schedule test / record result / close — one small form each.
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { patchData, postData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { useTokenStore } from '@/store/tokenStore';
import {
  CLOSE_REASONS,
  TEST_RESULTS,
  closeReasonLabel,
  isoToLocalInput,
  localInputToIso,
} from '@/utils/admission';
import {
  Field,
  inputCls,
  invalidateAdmissionData,
  modalPrimary,
  modalSecondary,
} from './admissionShared';

const optionalNumber = yup
  .number()
  .nullable()
  .transform((v, o) => (o === '' || o === null || o === undefined ? null : v))
  .typeError('Enter a number')
  .min(0, 'Min 0');

const MODES = {
  'follow-up': {
    title: 'Add follow-up',
    submit: 'Save follow-up',
    schema: yup.object({
      note: yup.string().trim().max(1000).required('Note is required'),
      nextFollowUpDate: yup.string(),
    }),
    defaults: () => ({ note: '', nextFollowUpDate: '' }),
    request: (id, v) => ({
      method: 'post',
      url: `/admission/enquiries/${id}/follow-ups`,
      payload: {
        note: v.note.trim(),
        ...(v.nextFollowUpDate ? { nextFollowUpDate: v.nextFollowUpDate } : {}),
      },
    }),
  },
  'schedule-test': {
    title: 'Schedule test / interview',
    submit: 'Schedule',
    schema: yup.object({
      scheduledAt: yup.string().required('Date and time are required'),
      venue: yup.string().max(150),
    }),
    defaults: (e) => ({
      scheduledAt: isoToLocalInput(e?.test?.scheduledAt),
      venue: e?.test?.venue || '',
    }),
    request: (id, v) => ({
      method: 'patch',
      url: `/admission/enquiries/${id}/test`,
      payload: {
        scheduledAt: localInputToIso(v.scheduledAt),
        ...(v.venue?.trim() ? { venue: v.venue.trim() } : {}),
      },
    }),
  },
  'record-result': {
    title: 'Record test result',
    submit: 'Save result',
    schema: yup.object({
      result: yup.string().oneOf(TEST_RESULTS, 'Select a result').required('Select a result'),
      marks: optionalNumber,
      remarks: yup.string().max(500),
    }),
    defaults: (e) => ({
      result: e?.test?.result || '',
      marks: e?.test?.marks ?? '',
      remarks: e?.test?.remarks || '',
    }),
    request: (id, v) => ({
      method: 'patch',
      url: `/admission/enquiries/${id}/test-result`,
      payload: {
        result: v.result,
        ...(v.marks !== null && v.marks !== undefined ? { marks: v.marks } : {}),
        ...(v.remarks?.trim() ? { remarks: v.remarks.trim() } : {}),
      },
    }),
  },
  close: {
    title: 'Close enquiry',
    submit: 'Close enquiry',
    schema: yup.object({
      reason: yup.string().oneOf(CLOSE_REASONS, 'Select a reason').required('Select a reason'),
      note: yup.string().max(500),
    }),
    defaults: () => ({ reason: '', note: '' }),
    request: (id, v) => ({
      method: 'patch',
      url: `/admission/enquiries/${id}/close`,
      payload: { reason: v.reason, ...(v.note?.trim() ? { note: v.note.trim() } : {}) },
    }),
  },
};

export default function EnquiryActionModal({ mode, enquiry, onClose }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const cfg = MODES[mode];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(cfg.schema), defaultValues: cfg.defaults(enquiry) });

  const mutation = useMutation({
    mutationFn: ({ method, url, payload }) =>
      method === 'post' ? postData({ url, payload, token }) : patchData({ url, payload, token }),
    onSuccess: (res) => {
      invalidateAdmissionData(queryClient);
      toast.success(res?.message || 'Saved');
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Could not save'),
  });

  const onSubmit = (values) => mutation.mutate(cfg.request(enquiry._id, values));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={cfg.title}
      subtitle={`${enquiry.enquiryNumber || ''} · ${enquiry.child?.name || ''}`}
      size="sm"
      footer={
        <div className="flex gap-3 w-full justify-end">
          <Button label="Cancel" handleClick={onClose} styleObject={modalSecondary} />
          <Button
            label={cfg.submit}
            loading={mutation.isPending}
            handleClick={handleSubmit(onSubmit)}
            styleObject={
              mode === 'close'
                ? { ...modalPrimary, baseColor: 'bg-red-600', hoverColor: 'hover:bg-red-700' }
                : modalPrimary
            }
          />
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {mode === 'follow-up' && (
          <>
            <Field label="Note" required error={errors.note?.message}>
              <textarea
                {...register('note')}
                rows={4}
                placeholder="Called the father; will visit on Saturday"
                className={inputCls}
              />
            </Field>
            <Field label="Next follow-up date" error={errors.nextFollowUpDate?.message}>
              <input
                type="date"
                min={localYMD()}
                {...register('nextFollowUpDate')}
                className={inputCls}
              />
            </Field>
          </>
        )}

        {mode === 'schedule-test' && (
          <>
            <Field label="Date & time" required error={errors.scheduledAt?.message}>
              <input type="datetime-local" {...register('scheduledAt')} className={inputCls} />
            </Field>
            <Field label="Venue" error={errors.venue?.message}>
              <input {...register('venue')} placeholder="Room 12" className={inputCls} />
            </Field>
          </>
        )}

        {mode === 'record-result' && (
          <>
            <Field label="Result" required error={errors.result?.message}>
              <select {...register('result')} className={`${inputCls} capitalize`}>
                <option value="">Select result...</option>
                {TEST_RESULTS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Marks" error={errors.marks?.message}>
              <input type="number" min="0" step="any" {...register('marks')} className={inputCls} />
            </Field>
            <Field label="Remarks" error={errors.remarks?.message}>
              <textarea {...register('remarks')} rows={3} className={inputCls} />
            </Field>
          </>
        )}

        {mode === 'close' && (
          <>
            <Field label="Reason" required error={errors.reason?.message}>
              <select {...register('reason')} className={inputCls}>
                <option value="">Select reason...</option>
                {CLOSE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {closeReasonLabel(r)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Note" error={errors.note?.message}>
              <textarea {...register('note')} rows={3} className={inputCls} />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
