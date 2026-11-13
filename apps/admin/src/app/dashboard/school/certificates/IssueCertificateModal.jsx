'use client';
// "Issue certificate" wizard: pick a student → pick a type → eligibility check
// (outstanding fees, blocking reasons, warnings) → type-specific fields →
// (SLC) confirm that the student will be marked as left → issue → print.
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '@/component/Modal';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { hasAnyAction } from '@/utils/permissions';
import { retryUnless4xx } from '@/utils/queryError';
import { formatMoney } from '@/utils/money';
import { localYMD } from '@/utils/localDate';
import {
  CERTIFICATE_TYPES,
  CONDUCTS,
  SLC_REASONS,
  buildIssuePayload,
  canSubmitIssue,
  certificateTypeLabel,
  conductLabel,
  forceSummary,
  formatCertDate,
  openLoansLabel,
  openLoansOf,
  outstandingSummary,
  reasonLabel,
  slcResultingStatus,
  toYMD,
} from '@/utils/certificateText';
import ConfirmModal from './ConfirmModal';
import {
  StudentSearch,
  inputCls,
  labelCls,
  errorCls,
  primaryBtn,
  secondaryBtn,
  invalidateCertificateData,
  warningsOf,
  PRINT_PATH,
} from './certificateShared';
import { useSchoolCurrency } from '@/hooks/useSchoolCurrency';

const TYPE_HINTS = {
  slc: 'Issued when the student leaves. Fees must be clear; the student is marked as left.',
  character: 'For any student of the school, including students who have left.',
  bonafide: 'Confirms the student is currently enrolled (e.g. for a bank account or visa).',
  'fee-clearance': 'Confirms that all fees are paid. Only possible with nothing outstanding.',
};

const remarks = yup.string().trim().max(300, 'At most 300 characters');
const dateAfter = (field, message) =>
  yup.string().test('after', message, function check(v) {
    const other = this.parent[field];
    return !v || !other || v >= other;
  });

const SCHEMAS = {
  slc: yup.object({
    leavingDate: yup.string().required('Leaving date is required'),
    reason: yup.string().oneOf(SLC_REASONS).required('Pick a reason'),
    reasonNote: yup
      .string()
      .trim()
      .max(200, 'At most 200 characters')
      .when('reason', {
        is: 'other',
        then: (s) => s.required('Describe the reason'),
      }),
    lastClass: yup.string().trim().required('Last class is required').max(50),
    conduct: yup.string().oneOf(CONDUCTS).required('Pick the conduct'),
    remarks,
  }),
  character: yup.object({
    conduct: yup.string().oneOf(CONDUCTS).required('Pick the conduct'),
    fromDate: yup.string(),
    toDate: dateAfter('fromDate', 'To date must be on or after the from date'),
    remarks,
  }),
  bonafide: yup.object({
    purpose: yup.string().trim().required('Purpose is required').max(150, 'At most 150 characters'),
    validTill: yup
      .string()
      .test('future', 'Valid till cannot be in the past', (v) => !v || v >= localYMD()),
  }),
  'fee-clearance': yup.object({}),
};

const defaultsFor = (type, suggested = {}) => {
  if (type === 'slc') {
    return {
      leavingDate: toYMD(suggested.leavingDate) || localYMD(),
      reason: 'transfer',
      reasonNote: '',
      lastClass: suggested.lastClass || '',
      conduct: 'good',
      remarks: '',
    };
  }
  if (type === 'character') {
    return {
      conduct: 'good',
      fromDate: toYMD(suggested.fromDate),
      toDate: '',
      remarks: '',
    };
  }
  if (type === 'bonafide') return { purpose: '', validTill: '' };
  return {};
};

export default function IssueCertificateModal({ isOpen, onClose, initialStudent = null }) {
  const { accessToken: token } = useTokenStore();
  const [student, setStudent] = useState(initialStudent);
  const [type, setType] = useState('');

  // Reset whenever the modal is (re)opened for a different prefilled student.
  const [openedFor, setOpenedFor] = useState(null);
  const openKey = isOpen ? initialStudent?.studentId || 'new' : null;
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    setStudent(initialStudent);
    setType('');
  }

  const studentId = student?.studentId;
  const {
    data: eligibilityRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['certificate-eligibility', studentId, type],
    queryFn: () => fetchData({ url: '/certificates/eligibility', token, studentId, type }),
    enabled: isOpen && !!token && !!studentId && !!type,
    retry: retryUnless4xx,
    staleTime: 0,
  });
  const eligibility = eligibilityRes?.data;

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue certificate"
      subtitle="Check eligibility, fill in the details and print"
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Student</label>
            <StudentSearch
              value={studentId}
              label={student?.label}
              onSelect={(s) => setStudent(s)}
              onClear={() => setStudent(null)}
            />
          </div>
          <div>
            <label className={labelCls}>Certificate type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="">Select a type...</option>
              {CERTIFICATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {certificateTypeLabel(t)}
                </option>
              ))}
            </select>
            {type && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{TYPE_HINTS[type]}</p>
            )}
          </div>
        </div>

        {studentId && type && (
          <>
            {error ? (
              <QueryErrorState error={error} fallback="Could not check eligibility" />
            ) : isLoading || !eligibility ? (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <EligibilityPanel eligibility={eligibility} />
                <IssueForm
                  key={`${studentId}:${type}`}
                  type={type}
                  studentId={studentId}
                  studentName={eligibility.student?.studentName || student?.label}
                  eligibility={eligibility}
                  onCancel={onClose}
                  onIssued={onClose}
                />
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function EligibilityPanel({ eligibility }) {
  const { symbol: currencySymbol } = useSchoolCurrency();
  const s = eligibility.student || {};
  const { total: outstanding, parts: outstandingParts } = outstandingSummary(eligibility);
  const reasons = eligibility.reasons || [];
  const warnings = eligibility.warnings || [];
  const openLoans = openLoansOf(eligibility);
  const cls = [s.className, s.sectionName].filter(Boolean).join(' - ');
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
        <Info label="Student" value={s.studentName} />
        <Info label="Father" value={s.fatherName} />
        <Info label="Admission No." value={s.admissionNumber} />
        <Info label="Class" value={cls} />
        {s.admissionDate && <Info label="Admitted" value={formatCertDate(s.admissionDate)} />}
        {s.branchName && <Info label="Branch" value={s.branchName} />}
        <Info
          label="Outstanding fees"
          value={
            <span
              className={
                outstanding > 0
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-green-700 dark:text-green-400 font-semibold'
              }
            >
              {formatMoney(outstanding, currencySymbol)}
            </span>
          }
        />
        {openLoans > 0 && (
          <Info
            label="Library books"
            value={
              <span className="text-red-600 dark:text-red-400 font-semibold">
                {openLoansLabel(openLoans)}
              </span>
            }
          />
        )}
        {outstandingParts.length > 0 && (
          <div className="col-span-2 md:col-span-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            {outstandingParts.map((p) => (
              <span key={p.key}>
                {p.label}:{' '}
                <span
                  className={
                    p.amount > 0
                      ? 'font-semibold text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                >
                  {formatMoney(p.amount, currencySymbol)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {eligibility.canIssue && !eligibility.needsForce && reasons.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" /> Eligible — this certificate can be issued.
        </div>
      )}
      {reasons.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="text-gray-900 dark:text-gray-100 break-words">{value || '—'}</div>
    </div>
  );
}

function IssueForm({ type, studentId, studentName, eligibility, onCancel, onIssued }) {
  const { symbol: currencySymbol } = useSchoolCurrency();
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const canForce = hasAnyAction(user?.role, ['issue-certificate-with-dues']);
  const [force, setForce] = useState(false);
  const [pending, setPending] = useState(null); // SLC values awaiting confirmation

  const defaults = useMemo(
    () => defaultsFor(type, eligibility?.suggested || {}),
    [type, eligibility?.suggested],
  );
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(SCHEMAS[type]), defaultValues: defaults });

  const outstanding = outstandingSummary(eligibility).total;
  const openLoans = openLoansOf(eligibility);
  // Dues and/or unreturned library books hold back an SLC; only a user with
  // issue-certificate-with-dues may force it. The server may already report
  // `canIssue` to such a user, so key off `needsForce` alone.
  const forceable =
    type === 'slc' && !!eligibility?.needsForce && !(eligibility?.reasons || []).length;
  const holdBack = forceSummary(eligibility, (n) => formatMoney(n, currencySymbol));
  const canSubmit = canSubmitIssue(eligibility, { force, canForce });

  const mutation = useMutation({
    mutationFn: (values) =>
      postData({
        url: '/certificates',
        token,
        payload: buildIssuePayload({ type, studentId, values, force: forceable && force }),
      }),
    onSuccess: (res) => {
      const cert = res?.data;
      toast.success(
        `${certificateTypeLabel(type)}${cert?.serialNumber ? ` ${cert.serialNumber}` : ''} issued`,
      );
      warningsOf(res).forEach((w) => toast(w, { icon: '⚠️', duration: 8000 }));
      invalidateCertificateData(queryClient);
      setPending(null);
      onIssued?.(cert);
      if (cert?._id) router.push(PRINT_PATH(cert._id));
    },
    onError: (err) => {
      toast.error(err.message || 'Could not issue the certificate');
      setPending(null);
      // Eligibility may have changed (e.g. a payment or another SLC).
      queryClient.invalidateQueries({ queryKey: ['certificate-eligibility', studentId, type] });
    },
  });

  const onSubmit = (values) => {
    if (!canSubmit) return;
    if (type === 'slc') setPending(values);
    else mutation.mutate(values);
  };

  const reason = watch('reason');
  const leavingDate = watch('leavingDate');
  const err = (name) => errors[name] && <p className={errorCls}>{errors[name].message}</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {type === 'slc' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Leaving date</label>
            <input type="date" {...register('leavingDate')} className={inputCls} />
            {err('leavingDate')}
          </div>
          <div>
            <label className={labelCls}>Reason for leaving</label>
            <select {...register('reason')} className={inputCls}>
              {SLC_REASONS.map((r) => (
                <option key={r} value={r}>
                  {reasonLabel(r)}
                </option>
              ))}
            </select>
            {err('reason')}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Reason note {reason === 'other' ? '' : '(optional)'}</label>
            <input
              type="text"
              {...register('reasonNote')}
              maxLength={200}
              placeholder="e.g. Family moved to another city"
              className={inputCls}
            />
            {err('reasonNote')}
          </div>
          <div>
            <label className={labelCls}>Last class attended</label>
            <input type="text" {...register('lastClass')} maxLength={50} className={inputCls} />
            {err('lastClass')}
          </div>
          <ConductSelect register={register} err={err} />
          <div className="sm:col-span-2">
            <label className={labelCls}>Remarks (optional)</label>
            <textarea {...register('remarks')} rows={2} maxLength={300} className={inputCls} />
            {err('remarks')}
          </div>
        </div>
      )}

      {type === 'character' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ConductSelect register={register} err={err} />
          <div className="hidden sm:block" />
          <div>
            <label className={labelCls}>Student from (optional)</label>
            <input type="date" {...register('fromDate')} className={inputCls} />
            {err('fromDate')}
          </div>
          <div>
            <label className={labelCls}>Student to (optional)</label>
            <input type="date" {...register('toDate')} className={inputCls} />
            {err('toDate')}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Remarks (optional)</label>
            <textarea {...register('remarks')} rows={2} maxLength={300} className={inputCls} />
            {err('remarks')}
          </div>
        </div>
      )}

      {type === 'bonafide' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Purpose</label>
            <input
              type="text"
              {...register('purpose')}
              maxLength={150}
              placeholder="e.g. opening a bank account"
              className={inputCls}
            />
            {err('purpose')}
          </div>
          <div>
            <label className={labelCls}>Valid till (optional)</label>
            <input type="date" {...register('validTill')} min={localYMD()} className={inputCls} />
            {err('validTill')}
          </div>
        </div>
      )}

      {type === 'fee-clearance' && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No extra details needed — the month fees are cleared up to is taken from the
          student&apos;s latest voucher.
        </p>
      )}

      {forceable &&
        (canForce ? (
          <label className="flex items-start gap-2 p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span>
              <strong>Issue anyway</strong> — {holdBack}.
              {outstanding > 0 &&
                " The dues stay on the student's account, and the certificate will not state that all dues are cleared."}
              {openLoans > 0 && " The books stay on the student's library record."}
            </span>
          </label>
        ) : (
          <p className="text-sm text-red-700 dark:text-red-300">
            {holdBack} — this must be cleared before this SLC can be issued. Only a user with the
            &quot;Issue SLC With Dues&quot; permission can issue it anyway.
          </p>
        ))}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className={secondaryBtn}>
          Close
        </button>
        <button type="submit" disabled={!canSubmit || mutation.isPending} className={primaryBtn}>
          {mutation.isPending ? 'Issuing…' : `Issue ${certificateTypeLabel(type)}`}
        </button>
      </div>

      <ConfirmModal
        isOpen={!!pending}
        onClose={() => !mutation.isPending && setPending(null)}
        title="Issue School Leaving Certificate?"
        confirmLabel="Issue & mark as left"
        confirmTone="danger"
        loading={mutation.isPending}
        onConfirm={() => pending && mutation.mutate(pending)}
      >
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>
            Issuing this SLC marks <strong>{studentName}</strong> as having left the school:
          </p>
          <ul className="list-disc ps-5 space-y-1">
            <li>
              Academic status becomes{' '}
              <strong className="capitalize">{slcResultingStatus(pending?.reason)}</strong> with
              leaving date {formatCertDate(pending?.leavingDate || leavingDate)}.
            </li>
            <li>The student&apos;s seat in the section is released.</li>
            <li>The student&apos;s portal login is blocked and signed out.</li>
            <li>Active transport assignments end on the leaving date.</li>
          </ul>
          {forceable && force && (
            <p className="text-red-700 dark:text-red-300">{holdBack} — issuing anyway.</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cancelling the certificate later restores the student.
          </p>
        </div>
      </ConfirmModal>
    </form>
  );
}

function ConductSelect({ register, err }) {
  return (
    <div>
      <label className={labelCls}>Conduct</label>
      <select {...register('conduct')} className={inputCls}>
        {CONDUCTS.map((c) => (
          <option key={c} value={c}>
            {conductLabel(c)}
          </option>
        ))}
      </select>
      {err('conduct')}
    </div>
  );
}
