'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { Upload, X, FileText } from 'lucide-react';
import { SUBMISSION_TYPES } from './constants';
import QuestionBuilder, { validateQuestions, serializeQuestions } from './QuestionBuilder';

const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;
const ACCEPT = '.jpeg,.jpg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';
const errorCls = 'text-red-500 text-xs mt-1';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

export default function AddHomeworkModal({ isOpen, onClose, onSuccess }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [files, setFiles] = useState([]);

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch =
    isAdmin || !!user?.role?.actions?.includes('create-all-branch-homework');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      branchId: '',
      academicYear: currentAcademicYear(),
      classId: '',
      sectionId: '',
      subjectId: '',
      teacherId: '',
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

  const branchId = watch('branchId');
  const academicYear = watch('academicYear');
  const classId = watch('classId');
  const submissionType = watch('submissionType');

  // Lock branch for non-org users.
  useEffect(() => {
    if (isOpen && !canCreateAllBranch && userBranchId) {
      setValue('branchId', userBranchId);
    }
  }, [isOpen, canCreateAllBranch, userBranchId, setValue]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
      setQuestions([]);
      setFiles([]);
    }
  }, [isOpen, reset]);

  // Cascade resets.
  useEffect(() => {
    setValue('classId', '');
    setValue('sectionId', '');
    setValue('subjectId', '');
  }, [branchId, academicYear, setValue]);

  useEffect(() => {
    setValue('sectionId', '');
    setValue('subjectId', '');
  }, [classId, setValue]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canCreateAllBranch && isOpen,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', branchId, academicYear],
    queryFn: () =>
      fetchData({ url: '/class/list', page: 1, limit: 200, token, branchId, academicYear }),
    enabled: !!token && !!branchId && !!academicYear && isOpen,
    staleTime: 30000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId && isOpen,
    staleTime: 30000,
  });
  const sections = sectionData?.data || [];

  const { data: subjectData } = useQuery({
    queryKey: ['subjects-dropdown', classId, academicYear],
    queryFn: () =>
      fetchData({ url: '/subject/list', page: 1, limit: 200, token, classId, academicYear }),
    enabled: !!token && !!classId && !!academicYear && isOpen,
    staleTime: 30000,
  });
  const subjects = subjectData?.data || [];

  // Teachers — only admins may assign on behalf of someone else.
  const { data: staffData } = useQuery({
    queryKey: ['staff-teaching-dropdown', branchId],
    queryFn: () =>
      fetchData({
        url: '/staff/list',
        page: 1,
        limit: 200,
        token,
        staffType: 'teaching',
        branchId,
        isActive: 'true',
      }),
    enabled: !!token && !!branchId && isAdmin && isOpen,
    staleTime: 30000,
  });
  const teachers = staffData?.data || [];

  const addFiles = (list) => {
    const picked = Array.from(list || []);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const next = [...prev];
      for (const f of picked) {
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name} is over the 5 MB limit.`);
          continue;
        }
        if (seen.has(`${f.name}:${f.size}`)) continue;
        if (next.length >= MAX_FILES) {
          toast.error(`Up to ${MAX_FILES} reference files.`);
          break;
        }
        next.push(f);
      }
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/homework/create', payload, token }),
    onSuccess: (res) => {
      // Push the new row into every cached list instead of refetching — the user
      // rejects a post-create /homework/list GET. Create returns only subjectId,
      // so graft the populated subject the table column expects.
      const created = res?.data;
      if (created) {
        const subj = subjects.find((s) => s._id === created.subjectId);
        const row = {
          ...created,
          subject: created.subject || (subj ? { _id: subj._id, name: subj.name } : undefined),
          submissionCount: created.submissionCount ?? 0,
        };
        queryClient.setQueriesData({ queryKey: ['homework'] }, (old) => {
          if (!old) return old;
          return { ...old, data: [row, ...(old.data || [])], total: (old.total || 0) + 1 };
        });
      }
      toast.success(res?.message || 'Homework created');
      onSuccess?.(created);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        reset();
        onClose();
      }, 800);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to create homework';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');

    // Required fields the form doesn't hard-validate via resolver.
    if (!data.classId || !data.sectionId || !data.subjectId) {
      setSubmitError('Class, section and subject are required.');
      return;
    }
    if (!data.title.trim() || !data.description.trim()) {
      setSubmitError('Title and instructions are required.');
      return;
    }
    if (!data.dueDate) {
      setSubmitError('Due date is required.');
      return;
    }
    if (academicYear && !ACADEMIC_YEAR_REGEX.test(academicYear)) {
      setSubmitError('Academic year must look like 2025-2026.');
      return;
    }
    // Admins create on behalf of a teacher — the homework needs a staff owner,
    // and an admin account has no staff profile of its own (backend 403s otherwise).
    if (isAdmin && !data.teacherId) {
      setSubmitError('Select the teacher this homework belongs to.');
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

    // Build the base fields.
    const base = {
      classId: data.classId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
      title: data.title.trim(),
      description: data.description.trim(),
      submissionType: data.submissionType,
      dueDate: new Date(data.dueDate).toISOString(),
      allowLateSubmission: data.allowLateSubmission === 'true',
      status: data.status,
    };
    if (data.assignedDate) base.assignedDate = new Date(data.assignedDate).toISOString();
    if (isAdmin && data.teacherId) base.teacherId = data.teacherId;
    // maxMarks only for manual types; mcq auto-computes from question marks.
    if (!isMcq && data.maxMarks !== '' && data.maxMarks != null) {
      base.maxMarks = Number(data.maxMarks);
    }
    const serializedQuestions = isMcq ? serializeQuestions(questions) : null;

    // Multipart when reference files are attached; JSON otherwise.
    if (files.length > 0) {
      const fd = new FormData();
      Object.entries(base).forEach(([k, v]) => fd.append(k, v));
      if (serializedQuestions) fd.append('questions', JSON.stringify(serializedQuestions));
      files.forEach((f) => fd.append('attachments', f));
      mutation.mutate(fd);
    } else {
      const payload = { ...base };
      if (serializedQuestions) payload.questions = serializedQuestions;
      mutation.mutate(payload);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Homework"
      subtitle="Assign work to a class section"
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
            label="Create Homework"
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

        {/* Target */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Target
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {canCreateAllBranch ? (
              <Field label="Branch" required error={errors.branchId?.message}>
                <select
                  {...register('branchId')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                >
                  <option value="">Select branch...</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <input type="hidden" {...register('branchId')} />
            )}
            <Field label="Academic Year" required>
              <input {...register('academicYear')} placeholder="2025-2026" className={inputCls} />
            </Field>
            <Field label="Class" required>
              <select
                {...register('classId')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
                disabled={!branchId}
              >
                <option value="">{branchId ? 'Select class...' : 'Select branch first'}</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.grade ? `(Grade ${c.grade})` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Section" required>
              <select
                {...register('sectionId')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
                disabled={!classId}
              >
                <option value="">{classId ? 'Select section...' : 'Select class first'}</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject" required>
              <select
                {...register('subjectId')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
                disabled={!classId}
              >
                <option value="">{classId ? 'Select subject...' : 'Select class first'}</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
              </select>
            </Field>
            {isAdmin && (
              <Field label="Teacher" required>
                <select
                  {...register('teacherId')}
                  className={`${inputCls} bg-white dark:bg-gray-900`}
                  disabled={!branchId}
                >
                  <option value="">{branchId ? 'Select teacher...' : 'Select branch first'}</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user?.name} {t.designation ? `— ${t.designation}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Details
          </h3>
          <div className="space-y-4">
            <Field label="Title" required>
              <input {...register('title')} placeholder="Algebra Quiz" className={inputCls} />
            </Field>
            <Field label="Instructions" required>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="What students need to do…"
                className={`${inputCls} resize-y`}
              />
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
                  <input
                    {...register('maxMarks')}
                    type="number"
                    min="0"
                    placeholder="100"
                    className={inputCls}
                  />
                </Field>
              )}
            </div>
          </div>
        </div>

        {/* MCQ builder */}
        {submissionType === 'mcq' && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <QuestionBuilder value={questions} onChange={setQuestions} />
          </div>
        )}

        {/* Schedule */}
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
                <option value="draft">Draft (hidden from students)</option>
                <option value="published">Published (visible now)</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Reference files */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Reference Files (optional)
          </h3>
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 px-4 py-6 text-center hover:border-teal-500 transition-colors">
            <input
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <Upload className="w-5 h-5 mx-auto text-gray-400" />
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Click to attach files</p>
            <p className="text-xs text-gray-400">
              JPEG, PNG, WEBP, PDF · up to 5 MB · max {MAX_FILES}
            </p>
          </label>
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}:${f.size}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                >
                  <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                    {f.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </Modal>
  );
}
