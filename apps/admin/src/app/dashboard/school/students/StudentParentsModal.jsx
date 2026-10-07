'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import QueryErrorState from '@/component/QueryErrorState';
import ConfirmModal from '../fees/ConfirmModal';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, KeyRound, Ban, CheckCircle, Unlink, ArrowLeft } from 'lucide-react';
import { fetchData, postDataWithStatus, putData, patchData, deleteData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { changedFields } from '@/utils/changedFields';
import {
  PARENT_RELATIONS,
  PARENT_PASSWORD_MIN,
  parentPrefill,
  hasPrefill,
  defaultRelation,
  otherChildren,
  parentCreateOutcome,
} from '@/utils/parentAccounts';
import { useTokenStore } from '@/store/tokenStore';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1';
const errorCls = 'text-red-500 text-xs mt-1';

const primaryBtn = {
  baseColor: 'bg-teal-600',
  hoverColor: 'hover:bg-teal-700',
  rounded: 'rounded-full',
  size: 'px-6 py-2.5 text-sm min-h-[2.75rem]',
  textColor: 'text-white',
};
const secondaryBtn = {
  baseColor: 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700',
  hoverColor: 'hover:bg-gray-50 dark:hover:bg-gray-800',
  rounded: 'rounded-full',
  size: 'px-6 py-2.5 text-sm min-h-[2.75rem]',
  textColor: 'text-gray-700 dark:text-gray-300',
};

function Field({ label, error, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

const passwordRules = (t) => ({
  password: yup
    .string()
    .min(PARENT_PASSWORD_MIN, t('validation.passwordMin', { min: PARENT_PASSWORD_MIN }))
    .required(t('validation.passwordMin', { min: PARENT_PASSWORD_MIN })),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], t('validation.passwordMismatch'))
    .required(t('validation.passwordMismatch')),
});

const identityRules = (t) => ({
  name: yup.string().trim().required(t('validation.nameRequired')),
  email: yup
    .string()
    .trim()
    .email(t('validation.emailInvalid'))
    .required(t('validation.emailRequired')),
  phone: yup.string().trim().optional(),
});

function FormActions({ t, onCancel, loading, label }) {
  return (
    <div className="flex flex-wrap gap-3 justify-end pt-2">
      <Button label={t('cancel')} handleClick={onCancel} styleObject={secondaryBtn} />
      <Button label={label} type="submit" loading={loading} styleObject={primaryBtn} />
    </div>
  );
}

function AddParentForm({ t, student, studentId, onDone, onCancel }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const schema = useMemo(
    () =>
      yup.object({
        relation: yup.string().oneOf(PARENT_RELATIONS, t('validation.relationRequired')).required(),
        ...identityRules(t),
        ...passwordRules(t),
      }),
    [t],
  );
  const initialRelation = defaultRelation(student);
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      relation: initialRelation,
      ...parentPrefill(student, initialRelation),
      password: '',
      confirmPassword: '',
    },
  });

  const relation = watch('relation');

  // Re-prefill when the relation changes, without overwriting what the admin typed.
  useEffect(() => {
    const prefill = parentPrefill(student, relation);
    ['name', 'phone', 'email'].forEach((f) => {
      if (!dirtyFields[f] || !getValues(f)) setValue(f, prefill[f]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relation, student]);

  const mutation = useMutation({
    mutationFn: (payload) => postDataWithStatus({ url: '/parent', payload, token }),
    onSuccess: ({ status }) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      const outcome = parentCreateOutcome(status);
      toast.success(outcome === 'created' ? t('created') : t('linked'), { duration: 6000 });
      onDone();
    },
    onError: (err) => {
      const msg = err.status === 409 ? t('emailConflict') : err.message || t('failed');
      setSubmitError(err.status === 409 && err.message ? `${msg} (${err.message})` : msg);
      toast.error(msg);
    },
  });

  const onSubmit = (values) => {
    setSubmitError('');
    const payload = {
      studentId,
      relation: values.relation,
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    };
    if (values.phone?.trim()) payload.phone = values.phone.trim();
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('addTitle')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('relation')} error={errors.relation?.message}>
          <select {...register('relation')} className={inputCls}>
            {PARENT_RELATIONS.map((r) => (
              <option key={r} value={r}>
                {t(`relations.${r}`)}
              </option>
            ))}
          </select>
          {hasPrefill(student, relation) && (
            <p className="text-xs text-teal-700 dark:text-teal-400 mt-1">
              {t('prefillHint', { relation: t(`relations.${relation}`) })}
            </p>
          )}
        </Field>
        <Field label={t('name')} error={errors.name?.message}>
          <input {...register('name')} className={inputCls} autoComplete="off" />
        </Field>
        <Field label={t('email')} error={errors.email?.message}>
          <input {...register('email')} type="email" className={inputCls} autoComplete="off" />
        </Field>
        <Field label={t('phone')} error={errors.phone?.message}>
          <input {...register('phone')} className={inputCls} autoComplete="off" />
        </Field>
        <Field label={t('password')} error={errors.password?.message}>
          <input
            {...register('password')}
            type="password"
            className={inputCls}
            autoComplete="new-password"
          />
        </Field>
        <Field label={t('confirmPassword')} error={errors.confirmPassword?.message}>
          <input
            {...register('confirmPassword')}
            type="password"
            className={inputCls}
            autoComplete="new-password"
          />
        </Field>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('linkHint')}</p>
      {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}
      <FormActions t={t} onCancel={onCancel} loading={mutation.isPending} label={t('addParent')} />
    </form>
  );
}

function EditParentForm({ t, parent, onDone, onCancel }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const schema = useMemo(() => yup.object(identityRules(t)), [t]);
  const initial = useMemo(
    () => ({ name: parent.name || '', email: parent.email || '', phone: parent.phone || '' }),
    [parent],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: initial });

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: `/parent/${parent._id}`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success(res?.message || t('updated'));
      onDone();
    },
    onError: (err) => {
      const msg = err.message || t('failed');
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (values) => {
    setSubmitError('');
    const trimmed = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: (values.phone || '').trim(),
    };
    const payload = changedFields(initial, trimmed);
    if (!Object.keys(payload).length) {
      toast(t('noChanges'));
      onDone();
      return;
    }
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t('editTitle', { name: parent.name })}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('name')} error={errors.name?.message}>
          <input {...register('name')} className={inputCls} />
        </Field>
        <Field label={t('email')} error={errors.email?.message}>
          <input {...register('email')} type="email" className={inputCls} />
        </Field>
        <Field label={t('phone')} error={errors.phone?.message}>
          <input {...register('phone')} className={inputCls} />
        </Field>
      </div>
      {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}
      <FormActions t={t} onCancel={onCancel} loading={mutation.isPending} label={t('save')} />
    </form>
  );
}

function ResetPasswordForm({ t, parent, onDone, onCancel }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const schema = useMemo(() => yup.object(passwordRules(t)), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (password) =>
      patchData({ url: `/parent/${parent._id}/password`, payload: { password }, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success(res?.message || t('passwordReset'));
      onDone();
    },
    onError: (err) => {
      const msg = err.message || t('failed');
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => {
        setSubmitError('');
        mutation.mutate(v.password);
      })}
      className="space-y-4"
      noValidate
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t('passwordTitle', { name: parent.name })}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('newPassword')} error={errors.password?.message}>
          <input
            {...register('password')}
            type="password"
            className={inputCls}
            autoComplete="new-password"
          />
        </Field>
        <Field label={t('confirmPassword')} error={errors.confirmPassword?.message}>
          <input
            {...register('confirmPassword')}
            type="password"
            className={inputCls}
            autoComplete="new-password"
          />
        </Field>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('passwordHint')}</p>
      {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}
      <FormActions
        t={t}
        onCancel={onCancel}
        loading={mutation.isPending}
        label={t('resetPassword')}
      />
    </form>
  );
}

function ActionButton({ icon: Icon, label, onClick, tone = 'gray' }) {
  const tones = {
    gray: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
    red: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40',
    green: 'text-green-700 hover:bg-green-50 dark:hover:bg-green-950/40',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${tones[tone]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/**
 * Parent portal accounts linked to one student: list, add/link, edit, reset
 * password, block/unblock and unlink. The list and the forms share one modal
 * (`view`); a destructive confirm temporarily replaces it so modals never stack.
 */
export default function StudentParentsModal({
  isOpen,
  onClose,
  student,
  canManage = false,
  canToggle = false,
}) {
  const t = useTranslations('studentParents');
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const studentId = student?._id;

  // view: { mode: 'list' | 'add' | 'edit' | 'password', parent? }
  const [view, setView] = useState({ mode: 'list' });
  // confirm: { kind: 'toggle' | 'unlink', parent }
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setView({ mode: 'list' });
      setConfirm(null);
    }
  }, [isOpen, studentId]);

  const parentsQuery = useQuery({
    queryKey: ['parents', studentId],
    queryFn: () => fetchData({ url: '/parent', studentId, token }),
    enabled: !!token && !!studentId && isOpen,
    retry: retryUnless4xx,
  });
  const parents = parentsQuery.data?.data || [];

  // Full record for the father / mother / guardian prefill (the list row may be partial);
  // if it fails, the form still opens with whatever the row carries.
  const detailQuery = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () => fetchData({ url: `/student/${studentId}`, token }),
    enabled: !!token && !!studentId && isOpen && view.mode === 'add',
    staleTime: 30000,
  });
  const fullStudent = detailQuery.data?.data || student;

  const onMutationError = (err) => toast.error(err.message || t('failed'));
  const afterConfirm = (msg) => {
    queryClient.invalidateQueries({ queryKey: ['parents'] });
    toast.success(msg);
    setConfirm(null);
  };

  const toggleMutation = useMutation({
    mutationFn: (parent) =>
      patchData({
        url: `/parent/${parent._id}/status`,
        payload: { isActive: !parent.isActive },
        token,
      }),
    onSuccess: (res) => afterConfirm(res?.message || t('statusUpdated')),
    onError: onMutationError,
  });

  const unlinkMutation = useMutation({
    mutationFn: (parent) =>
      deleteData({ url: `/parent/${parent._id}/children/${studentId}`, token }),
    onSuccess: (res) => afterConfirm(res?.message || t('unlinked')),
    onError: onMutationError,
  });

  if (!isOpen || !student) return null;

  const toList = () => setView({ mode: 'list' });

  if (confirm) {
    const { kind, parent } = confirm;
    const blocking = kind === 'toggle' && parent.isActive;
    const props =
      kind === 'unlink'
        ? {
            title: t('unlinkTitle'),
            message: t('unlinkMessage', { name: parent.name }),
            confirmLabel: t('unlink'),
            confirmTone: 'danger',
            loading: unlinkMutation.isPending,
            onConfirm: () => unlinkMutation.mutate(parent),
          }
        : {
            title: blocking ? t('blockTitle') : t('unblockTitle'),
            message: t(blocking ? 'blockMessage' : 'unblockMessage', { name: parent.name }),
            confirmLabel: blocking ? t('block') : t('unblock'),
            confirmTone: blocking ? 'danger' : 'primary',
            loading: toggleMutation.isPending,
            onConfirm: () => toggleMutation.mutate(parent),
          };
    return (
      <ConfirmModal isOpen onClose={() => setConfirm(null)} cancelLabel={t('cancel')} {...props} />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      subtitle={t('subtitle', {
        name: student.user?.name || '',
        admissionNumber: student.admissionNumber || '',
      })}
      size="lg"
    >
      {view.mode !== 'list' && (
        <button
          type="button"
          onClick={toList}
          className="flex items-center gap-1 text-sm text-teal-700 dark:text-teal-400 hover:underline mb-3"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('back')}
        </button>
      )}

      {view.mode === 'add' && detailQuery.isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {view.mode === 'add' && !detailQuery.isLoading && (
        <AddParentForm
          t={t}
          student={fullStudent}
          studentId={studentId}
          onDone={toList}
          onCancel={toList}
        />
      )}

      {view.mode === 'edit' && (
        <EditParentForm t={t} parent={view.parent} onDone={toList} onCancel={toList} />
      )}

      {view.mode === 'password' && (
        <ResetPasswordForm t={t} parent={view.parent} onDone={toList} onCancel={toList} />
      )}

      {view.mode === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('intro')}</p>
            {canManage && (
              <button
                type="button"
                onClick={() => setView({ mode: 'add' })}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm text-sm flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                {t('addParent')}
              </button>
            )}
          </div>

          {parentsQuery.isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {parentsQuery.isError && (
            <QueryErrorState error={parentsQuery.error} fallback={t('loadError')} />
          )}

          {parentsQuery.isSuccess && parents.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">{t('noParents')}</p>
          )}

          {parents.length > 0 && (
            <ul className="space-y-3">
              {parents.map((p) => {
                const others = otherChildren(p, studentId);
                return (
                  <li
                    key={p._id}
                    className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {p.name}
                          </span>
                          {p.relation && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800">
                              {PARENT_RELATIONS.includes(p.relation)
                                ? t(`relations.${p.relation}`)
                                : p.relation}
                            </span>
                          )}
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {p.isActive ? t('active') : t('blocked')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-all">
                          {p.email}
                          {p.phone ? ` · ${p.phone}` : ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium">{t('otherChildren')}:</span>{' '}
                          {others.length
                            ? others
                                .map((c) =>
                                  [
                                    c.name,
                                    [c.class?.name, c.section?.name].filter(Boolean).join(' / '),
                                  ]
                                    .filter(Boolean)
                                    .join(' — '),
                                )
                                .join(', ')
                            : t('none')}
                        </div>
                      </div>
                      {(canManage || canToggle) && (
                        <div className="flex flex-wrap gap-1">
                          {canManage && (
                            <ActionButton
                              icon={Edit}
                              label={t('edit')}
                              onClick={() => setView({ mode: 'edit', parent: p })}
                            />
                          )}
                          {canManage && (
                            <ActionButton
                              icon={KeyRound}
                              label={t('resetPassword')}
                              onClick={() => setView({ mode: 'password', parent: p })}
                            />
                          )}
                          {canToggle && (
                            <ActionButton
                              icon={p.isActive ? Ban : CheckCircle}
                              label={p.isActive ? t('block') : t('unblock')}
                              tone={p.isActive ? 'red' : 'green'}
                              onClick={() => setConfirm({ kind: 'toggle', parent: p })}
                            />
                          )}
                          {canManage && (
                            <ActionButton
                              icon={Unlink}
                              label={t('unlink')}
                              tone="red"
                              onClick={() => setConfirm({ kind: 'unlink', parent: p })}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
