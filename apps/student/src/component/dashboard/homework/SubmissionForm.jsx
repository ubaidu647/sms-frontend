'use client';
import { useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Per-type submit form (§4.3). On submit it builds the right body and calls the
// passed mutation. `pending` drives the disabled/spinner state.

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file (§1)
const ACCEPT = '.jpeg,.jpg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';

const btn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#00918e] px-4 py-2 text-sm font-medium text-white hover:bg-[#00736f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

function Submitting() {
  return (
    <>
      <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
    </>
  );
}

// document → multipart, files in `attachments` (≥ 1)
function DocumentForm({ onSubmit, pending }) {
  const [files, setFiles] = useState([]);

  const addFiles = (list) => {
    const picked = Array.from(list || []);
    const valid = [];
    for (const f of picked) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is over the 5 MB limit.`);
        continue;
      }
      valid.push(f);
    }
    // De-dupe by name+size so re-picking the same file doesn't double it.
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      return [...prev, ...valid.filter((f) => !seen.has(`${f.name}:${f.size}`))];
    });
  };

  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (files.length === 0) {
      toast.error('Attach at least one file.');
      return;
    }
    const fd = new FormData();
    files.forEach((f) => fd.append('attachments', f));
    onSubmit(fd);
  };

  return (
    <div className="space-y-4">
      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 px-4 py-8 text-center hover:border-[#00918e] transition-colors">
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
        <Upload className="w-6 h-6 mx-auto text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Click to choose files
        </p>
        <p className="mt-0.5 text-xs text-gray-400">JPEG, PNG, WEBP or PDF · up to 5 MB each</p>
      </label>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}:${f.size}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2"
            >
              <FileText className="w-4 h-4 text-[#00918e] flex-shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                {f.name}
              </span>
              <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                disabled={pending}
                className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={handleSubmit} disabled={pending} className={btn}>
        {pending ? <Submitting /> : 'Submit homework'}
      </button>
    </div>
  );
}

// written → { answerText }
function WrittenForm({ onSubmit, pending }) {
  const [answerText, setAnswerText] = useState('');

  const handleSubmit = () => {
    if (!answerText.trim()) {
      toast.error('Write your answer before submitting.');
      return;
    }
    onSubmit({ answerText: answerText.trim() });
  };

  return (
    <div className="space-y-4">
      <textarea
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        disabled={pending}
        rows={10}
        placeholder="Type your answer here…"
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-4 py-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00918e]/40 resize-y"
      />
      <button type="button" onClick={handleSubmit} disabled={pending} className={btn}>
        {pending ? <Submitting /> : 'Submit answer'}
      </button>
    </div>
  );
}

// mcq → { answers: [{ questionIndex, selectedOptionIndex }] } (every question
// answered; correct option is never sent to the client).
function McqForm({ questions = [], onSubmit, pending }) {
  const [selected, setSelected] = useState({}); // questionIndex → optionIndex

  const handleSubmit = () => {
    if (questions.some((_, qi) => selected[qi] === undefined)) {
      toast.error('Answer every question before submitting.');
      return;
    }
    const answers = questions.map((_, qi) => ({
      questionIndex: qi,
      selectedOptionIndex: selected[qi],
    }));
    onSubmit({ answers });
  };

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            <span className="text-gray-400">{qi + 1}.</span> {q.questionText}
            {q.marks != null && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({q.marks} mark{q.marks === 1 ? '' : 's'})
              </span>
            )}
          </p>
          <div className="mt-3 space-y-2">
            {(q.options || []).map((opt, oi) => {
              const checked = selected[qi] === oi;
              return (
                <label
                  key={oi}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    checked
                      ? 'border-[#00918e] bg-[#00918e]/5'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={checked}
                    disabled={pending}
                    onChange={() => setSelected((prev) => ({ ...prev, [qi]: oi }))}
                    className="accent-[#00918e]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{opt.text}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <button type="button" onClick={handleSubmit} disabled={pending} className={btn}>
        {pending ? <Submitting /> : 'Submit answers'}
      </button>
    </div>
  );
}

export default function SubmissionForm({ homework, onSubmit, pending }) {
  switch (homework.submissionType) {
    case 'written':
      return <WrittenForm onSubmit={onSubmit} pending={pending} />;
    case 'mcq':
      return <McqForm questions={homework.questions} onSubmit={onSubmit} pending={pending} />;
    case 'document':
    default:
      return <DocumentForm onSubmit={onSubmit} pending={pending} />;
  }
}
