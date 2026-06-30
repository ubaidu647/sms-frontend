'use client';
import { use } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen,
  ArrowLeft,
  Clock,
  Paperclip,
  CheckCircle2,
  XCircle,
  Award,
  Info,
} from 'lucide-react';
import { useHomeworkDetail, useSubmitHomework } from '@/hooks/useHomework';
import { PageHeader, Panel } from '@/component/dashboard/Panel';
import { Loading, ErrorState } from '@/component/dashboard/States';
import { SubmissionBadge, TypeBadge, getSubmitState } from '@/component/dashboard/homework/badges';
import SubmissionForm from '@/component/dashboard/homework/SubmissionForm';
import { formatDate } from '@/utils/format';

const fileName = (att) =>
  att.originalName || att.fileName || att.filename || att.name || 'Attachment';
const fileUrl = (att) => att.url || att.path || att.location || '#';

// Reference files the teacher attached to the homework.
function ReferenceFiles({ attachments }) {
  if (!attachments?.length) return null;
  return (
    <Panel title="Reference files">
      <ul className="space-y-2">
        {attachments.map((att, i) => (
          <li key={att._id || i}>
            <a
              href={fileUrl(att)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-[#00918e] transition-colors no-underline"
            >
              <Paperclip className="w-4 h-4 text-[#00918e] flex-shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                {fileName(att)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// What the student already submitted (read-only). MCQ shows per-question
// correctness + the auto-graded score.
function SubmittedView({ homework }) {
  const sub = homework.mySubmission;
  if (!sub) return null;

  const graded = homework.submissionStatus === 'graded';

  return (
    <Panel title="Your submission">
      {graded && sub.marksObtained != null && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/30 px-4 py-3">
          <Award className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              Score: {sub.marksObtained} / {homework.maxMarks}
            </p>
            {sub.feedback && (
              <p className="mt-0.5 text-sm text-green-700/80 dark:text-green-300/80">
                {sub.feedback}
              </p>
            )}
          </div>
        </div>
      )}

      {homework.submissionType === 'written' && (
        <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
          {sub.answerText}
        </p>
      )}

      {homework.submissionType === 'document' && (
        <ul className="space-y-2">
          {(sub.attachments || []).map((att, i) => (
            <li key={att._id || i}>
              <a
                href={fileUrl(att)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-[#00918e] transition-colors no-underline"
              >
                <Paperclip className="w-4 h-4 text-[#00918e] flex-shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                  {fileName(att)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {homework.submissionType === 'mcq' && (
        <ul className="space-y-3">
          {(sub.answers || []).map((ans, i) => {
            const q = homework.questions?.[ans.questionIndex] ?? {};
            const chosen = q.options?.[ans.selectedOptionIndex]?.text;
            return (
              <li key={i} className="flex items-start gap-2">
                {ans.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {q.questionText || `Question ${ans.questionIndex + 1}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your answer: {chosen ?? '—'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export default function HomeworkDetailPage({ params }) {
  const { id } = use(params);
  const { data: homework, isLoading, isError, error, refetch } = useHomeworkDetail(id);
  const submit = useSubmitHomework(id);

  const handleSubmit = (body) => {
    submit.mutate(body, {
      onSuccess: (sub) => {
        if (sub?.status === 'graded' && sub.marksObtained != null) {
          toast.success(`Submitted! Score: ${sub.marksObtained}/${homework.maxMarks}`);
        } else {
          toast.success('Homework submitted.');
        }
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || err.message || 'Could not submit.');
      },
    });
  };

  const backLink = (
    <Link
      href="/dashboard/homework"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#00918e] transition-colors no-underline mb-4"
    >
      <ArrowLeft className="w-4 h-4" /> All homework
    </Link>
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        {backLink}
        <Loading label="Loading homework…" />
      </div>
    );
  }

  if (isError || !homework) {
    return (
      <div className="max-w-3xl">
        {backLink}
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const { canSubmit, reason } = getSubmitState(homework);
  const hasSubmission = !!homework.mySubmission;
  const overdue = homework.isPastDue && homework.submissionStatus === 'pending';

  return (
    <div className="max-w-3xl">
      {backLink}

      <PageHeader
        icon={BookOpen}
        title={homework.title}
        subtitle={homework.subject?.name}
        action={
          <div className="flex items-center gap-2">
            <SubmissionBadge status={homework.submissionStatus} />
            <TypeBadge type={homework.submissionType} />
          </div>
        }
      />

      <div className="space-y-4">
        <Panel title="Instructions">
          <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
            {homework.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
            <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
              <Clock className="w-3 h-3" /> Due{' '}
              {formatDate(homework.dueDate, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {homework.maxMarks != null && <span>Max marks: {homework.maxMarks}</span>}
            {homework.allowLateSubmission && homework.isPastDue && (
              <span className="text-[#b07d00] dark:text-[#f5b21c]">Late submission allowed</span>
            )}
          </div>
        </Panel>

        <ReferenceFiles attachments={homework.attachments} />

        {hasSubmission && <SubmittedView homework={homework} />}

        {canSubmit ? (
          <Panel title={hasSubmission ? 'Resubmit' : 'Submit'}>
            {hasSubmission && (
              <p className="mb-4 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Submitting again will replace your current submission.
              </p>
            )}
            <SubmissionForm
              homework={homework}
              onSubmit={handleSubmit}
              pending={submit.isPending}
            />
          </Panel>
        ) : (
          reason && (
            <Panel>
              <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Info className="w-4 h-4 flex-shrink-0" />
                {reason}
              </p>
            </Panel>
          )
        )}
      </div>
    </div>
  );
}
