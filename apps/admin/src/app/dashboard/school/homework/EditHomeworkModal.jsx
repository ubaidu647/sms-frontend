'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { SUBMISSION_TYPES } from './constants';
import QuestionBuilder, { validateQuestions, serializeQuestions } from './QuestionBuilder';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';

function Field({ label, required, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ISO → value for <input type="datetime-local"> (local time, trimmed to minutes).
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export default function EditHomeworkModal({ isOpen, onClose, onSuccess, homework }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [questions, setQuestions] = useState([]);

  const id = homework?._id;

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      title: '',
      description: '',
      submissionType: 'document',
      maxMarks: '',
      dueDate: '',
      assignedDate: '',
      allowLateSubmission: 'true',
      status: 'draft',
    },
  });

  const submissionType = watch('submissionType');

  // Hydrate when opened with a homework row.
  useEffect(() => {
    if (isOpen && homework) {
      reset({
        title: homework.title || '',
        description: homework.description || '',
        submissionType: homework.submissionType || 'document',
        maxMarks: homework.maxMarks ?? '',
        dueDate: toLocalInput(homework.dueDate),
        assignedDate: toLocalInput(homework.assignedDate),
        allowLateSubmission: homework.allowLateSubmission === false ? 'false' : 'true',
        status: homework.status || 'draft',
      });
      setQuestions(
        (homework.questions || []).map((q) => ({
          questionText: q.questionText || '',
          options: (q.options || []).map((o) => ({ text: o.text ?? '' })),
          correctOptionIndex: q.correctOptionIndex ?? 0,
          marks: q.marks ?? 1,
        })),
      );
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, homework, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: `/homework/${id}`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success(res?.message || 'Homework updated');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 800);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to update homework';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    if (!data.title.trim() || !data.description.trim()) {
      setSubmitError('Title and instructions are required.');
      return;
    }
    if (!data.dueDate) {
      setSubmitError('Due date is required.');
      return;
    }

    const isMcq = data.submissionType === 'mcq';
    if (isMcq) {
      const qError = validateQuestions(questions);
      if (qError) {
        setSubmitError(qError);
        return;
      }
    }

    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      submissionType: data.submissionType,
      dueDate: new Date(data.dueDate).toISOString(),
      allowLateSubmission: data.allowLateSubmission === 'true',
      status: data.status,
    };
    payload.assignedDate = data.assignedDate ? new Date(data.assignedDate).toISOString() : null;
    if (isMcq) {
      payload.questions = serializeQuestions(questions); // backend recomputes maxMarks
    } else {
      payload.maxMarks = data.maxMarks === '' ? null : Number(data.maxMarks);
    }
    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Homework"
      subtitle={homework?.title}
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label="Save Changes"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={mutation.isPending}
            success={successState}
            handleClick={handleSubmit(onSubmit)}
          />
        </div>
      }
    >
      <form className="space-y-6">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="space-y-4">
          <Field label="Title" required>
            <input {...register('title')} className={inputCls} />
          </Field>
          <Field label="Instructions" required>
            <textarea {...register('description')} rows={3} className={`${inputCls} resize-y`} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Submission Type" required>
              <select
                {...register('submissionType')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
              >
                {SUBMISSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            {submissionType !== 'mcq' && (
              <Field label="Max Marks (optional)">
                <input {...register('maxMarks')} type="number" min="0" className={inputCls} />
              </Field>
            )}
          </div>
        </div>

        {submissionType === 'mcq' && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <QuestionBuilder value={questions} onChange={setQuestions} />
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Schedule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Due Date" required>
              <input {...register('dueDate')} type="datetime-local" className={inputCls} />
            </Field>
            <Field label="Assigned Date (optional)">
              <input {...register('assignedDate')} type="datetime-local" className={inputCls} />
            </Field>
            <Field label="Allow Late Submission">
              <select
                {...register('allowLateSubmission')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
            <Field label="Status">
              <select {...register('status')} className={`${inputCls} bg-white dark:bg-gray-900`}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed (read-only)</option>
                <option value="archived">Archived (hidden)</option>
              </select>
            </Field>
          </div>
        </div>
      </form>
    </Modal>
  );
}
