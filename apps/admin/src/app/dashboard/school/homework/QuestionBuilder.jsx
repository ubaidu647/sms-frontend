'use client';
import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';

// Controlled MCQ question builder. `value` is the questions array, `onChange`
// receives the next array. Each question: { questionText, options:[{text}],
// correctOptionIndex, marks }. maxMarks is auto-summed by the backend.

const emptyQuestion = () => ({
  questionText: '',
  options: [{ text: '' }, { text: '' }],
  correctOptionIndex: 0,
  marks: 1,
});

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';

export default function QuestionBuilder({ value = [], onChange }) {
  const questions = value;

  const update = (next) => onChange(next);

  const setQuestion = (qi, patch) =>
    update(questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const addQuestion = () => update([...questions, emptyQuestion()]);

  const removeQuestion = (qi) => update(questions.filter((_, i) => i !== qi));

  const setOption = (qi, oi, text) =>
    setQuestion(qi, {
      options: questions[qi].options.map((o, i) => (i === oi ? { ...o, text } : o)),
    });

  const addOption = (qi) => setQuestion(qi, { options: [...questions[qi].options, { text: '' }] });

  const removeOption = (qi, oi) => {
    const q = questions[qi];
    if (q.options.length <= 2) return; // need at least 2
    const options = q.options.filter((_, i) => i !== oi);
    // Keep correctOptionIndex valid after removal.
    let correct = q.correctOptionIndex;
    if (oi === correct) correct = 0;
    else if (oi < correct) correct -= 1;
    setQuestion(qi, { options, correctOptionIndex: correct });
  };

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Questions ({questions.length}) · {totalMarks} total marks
        </h3>
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-1 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline"
        >
          <Plus className="w-4 h-4" /> Add question
        </button>
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          Add at least one question. Each needs 2+ options and one marked correct.
        </p>
      )}

      {questions.map((q, qi) => (
        <div
          key={qi}
          className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-800/40"
        >
          <div className="flex items-start gap-2">
            <span className="mt-2 text-sm font-bold text-gray-400">{qi + 1}.</span>
            <input
              value={q.questionText}
              onChange={(e) => setQuestion(qi, { questionText: e.target.value })}
              placeholder="Question text"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => removeQuestion(qi)}
              title="Remove question"
              className="mt-1 p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 pl-5">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correctOptionIndex === oi}
                  onChange={() => setQuestion(qi, { correctOptionIndex: oi })}
                  title="Mark as correct"
                  className="accent-teal-600 flex-shrink-0"
                />
                <input
                  value={opt.text}
                  onChange={(e) => setOption(qi, oi, e.target.value)}
                  placeholder={`Option ${oi + 1}`}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => removeOption(qi, oi)}
                  disabled={q.options.length <= 2}
                  title="Remove option"
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => addOption(qi)}
                className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
              >
                + Add option
              </button>
              <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                Marks
                <input
                  type="number"
                  min="0"
                  value={q.marks}
                  onChange={(e) => setQuestion(qi, { marks: e.target.value })}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400">
              Selected radio marks the correct answer (students never see it).
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Validate the questions array client-side; returns an error string or null.
export function validateQuestions(questions) {
  if (!questions?.length) return 'Add at least one question.';
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText?.trim()) return `Question ${i + 1}: question text is required.`;
    const opts = q.options || [];
    if (opts.length < 2) return `Question ${i + 1}: at least 2 options are required.`;
    if (opts.some((o) => !o.text?.trim())) return `Question ${i + 1}: every option needs text.`;
    if (
      q.correctOptionIndex == null ||
      q.correctOptionIndex < 0 ||
      q.correctOptionIndex >= opts.length
    )
      return `Question ${i + 1}: mark a correct option.`;
  }
  return null;
}

// Normalise marks to numbers before sending.
export function serializeQuestions(questions) {
  return questions.map((q) => ({
    questionText: q.questionText.trim(),
    options: q.options.map((o) => ({ text: o.text.trim() })),
    correctOptionIndex: q.correctOptionIndex,
    marks: Number(q.marks) || 1,
  }));
}
