'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Lock } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import toast from 'react-hot-toast';
import {
  EXAM_STATUS_COLORS,
  GRADE_COLORS,
  formatDate,
  gradeFromPercentage,
} from '@/constants/exam';
import { resolveScope } from '@/utils/permissions';

export default function MarksEntryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params.examId;
  const initialExamSubjectId = searchParams.get('examSubjectId') || '';

  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canEnter =
    isAdmin || actions.includes('enter-marks') || actions.includes('enter-all-branch-marks');
  // Teacher-mode: role only carries `view-own-teaching-assignment`. Backend already blocks
  // section/subject mismatches; we narrow the section dropdown so it doesn't even appear.
  const teachingScope = resolveScope(user?.role, 'view-teaching-assignment');
  const isTeacherMode = teachingScope === 'own' && !isAdmin;

  const [examSubjectId, setExamSubjectId] = useState(initialExamSubjectId);
  const [sectionId, setSectionId] = useState('');
  const [marks, setMarks] = useState({});

  const {
    data: examRes,
    isLoading: examLoading,
    isError: examIsError,
    error: examError,
  } = useQuery({
    queryKey: ['exam-detail', examId],
    queryFn: () => fetchData({ url: `/exam/${examId}`, token }),
    enabled: !!token && !!examId,
    retry: false,
  });
  const exam = examRes?.data;
  const examSubjects = exam?.subjects || [];
  const isLocked = exam?.status === 'published';

  const examSubject = examSubjects.find((s) => s._id === examSubjectId);
  const classId = exam?.class?._id || exam?.classId;
  const hasTheory = examSubject?.theoryMarks != null;
  const hasPractical = examSubject?.practicalMarks != null;
  const examSubjectSubjectId =
    typeof examSubject?.subject === 'object' ? examSubject?.subject?._id : examSubject?.subject;

  useEffect(() => {
    if (!examIsError) return;
    const msg = examError?.response?.data?.message || examError?.message || 'Failed to load exam';
    toast.error(msg);
  }, [examIsError, examError]);

  // Admin / branch users: list every section in the class.
  const { data: allSectionsData } = useQuery({
    queryKey: ['sections-dropdown', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId && !isTeacherMode,
    staleTime: 60000,
  });

  // Teachers: only show sections from their own teaching assignments for the picked subject
  // in this exam's class. Backend's `view-own-teaching-assignment` scope pins staffId to self.
  const { data: teacherAssignData } = useQuery({
    queryKey: ['teacher-sections', classId, examSubjectSubjectId],
    queryFn: () =>
      fetchData({
        url: '/teaching-assignment/list',
        page: 1,
        limit: 200,
        token,
        classId,
        subjectId: examSubjectSubjectId,
        isActive: true,
      }),
    enabled: !!token && isTeacherMode && !!classId && !!examSubjectSubjectId,
    staleTime: 60000,
  });

  const sections = useMemo(() => {
    if (isTeacherMode) {
      const assignments = teacherAssignData?.data || [];
      const seen = new Map();
      for (const a of assignments) {
        const sec = a.section;
        if (!sec?._id || seen.has(sec._id)) continue;
        seen.set(sec._id, { _id: sec._id, name: sec.name });
      }
      return Array.from(seen.values());
    }
    return allSectionsData?.data || [];
  }, [isTeacherMode, teacherAssignData, allSectionsData]);

  // If the previously-chosen section is no longer in the narrowed list (e.g. teacher
  // switched subjects), clear it so the user is forced to pick a valid one.
  useEffect(() => {
    if (!sectionId) return;
    if (!sections.length) return;
    if (!sections.some((s) => s._id === sectionId)) setSectionId('');
  }, [sections, sectionId]);

  const { data: studentRes, isFetching: studentsLoading } = useQuery({
    queryKey: ['students-by-section', sectionId],
    queryFn: () =>
      fetchData({
        url: '/student/list',
        page: 1,
        limit: 500,
        token,
        sectionId,
        isActive: true,
      }),
    enabled: !!token && !!sectionId,
    staleTime: 30000,
  });
  const students = studentRes?.data || [];

  const {
    data: resultsRes,
    isFetching: resultsLoading,
    isError: resultsIsError,
    error: resultsError,
  } = useQuery({
    queryKey: ['exam-results', examId, examSubjectId, sectionId],
    queryFn: () =>
      fetchData({
        url: `/exam/${examId}/results`,
        token,
        examSubjectId,
        sectionId,
      }),
    enabled: !!token && !!examId && !!examSubjectId && !!sectionId,
    staleTime: 0,
    retry: false,
  });
  const existingResults = resultsRes?.data || [];

  useEffect(() => {
    if (!resultsIsError) return;
    const msg =
      resultsError?.response?.data?.message || resultsError?.message || 'Failed to load results';
    toast.error(msg);
  }, [resultsIsError, resultsError]);

  useEffect(() => {
    if (!students.length) {
      setMarks({});
      return;
    }
    const initial = {};
    students.forEach((s) => {
      const r = existingResults.find((er) => {
        const sid = typeof er.studentId === 'object' ? er.studentId?._id : er.studentId;
        return sid === s._id;
      });
      initial[s._id] = {
        theoryObtained: r?.theoryObtained ?? '',
        practicalObtained: r?.practicalObtained ?? '',
        isAbsent: r?.isAbsent ?? false,
        remarks: r?.remarks ?? '',
      };
    });
    setMarks(initial);
  }, [students, existingResults]);

  const updateMark = (studentId, patch) => {
    setMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const enterMutation = useMutation({
    mutationFn: (payload) => postData({ url: `/exam/${examId}/results/enter`, payload, token }),
    onSuccess: (res) => {
      const { created = 0, updated = 0 } = res?.data || {};
      toast.success(`Saved — ${created} created, ${updated} updated`);
      queryClient.invalidateQueries({
        queryKey: ['exam-results', examId, examSubjectId, sectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['exam-detail', examId] });
    },
    onError: (err) => toast.error(err.message || 'Failed to save marks'),
  });

  const handleSave = () => {
    if (!examSubjectId || !sectionId) {
      toast.error('Pick subject and section first');
      return;
    }
    if (!students.length) {
      toast.error('No students in this section');
      return;
    }
    const entries = students.map((s) => {
      const m = marks[s._id] || {};
      const entry = { studentId: s._id };
      if (m.isAbsent) {
        entry.isAbsent = true;
      } else {
        if (hasTheory) entry.theoryObtained = Number(m.theoryObtained) || 0;
        if (hasPractical) entry.practicalObtained = Number(m.practicalObtained) || 0;
        if (!hasTheory && !hasPractical) {
          entry.theoryObtained = Number(m.theoryObtained) || 0;
        }
      }
      if (m.remarks) entry.remarks = m.remarks;
      return entry;
    });
    enterMutation.mutate({ examSubjectId, sectionId, entries });
  };

  const computedRow = (studentId) => {
    const m = marks[studentId] || {};
    if (m.isAbsent) return { total: 0, pct: 0, grade: '—', passed: false };
    const t = Number(m.theoryObtained) || 0;
    const p = Number(m.practicalObtained) || 0;
    const total = t + p;
    const totalMax = examSubject?.totalMarks || 100;
    const pct = totalMax ? Math.round((total / totalMax) * 100) : 0;
    return {
      total,
      pct,
      grade: gradeFromPercentage(pct),
      passed: total >= (examSubject?.passingMarks ?? 0),
    };
  };

  const counts = useMemo(() => {
    let absent = 0;
    let entered = 0;
    Object.values(marks).forEach((m) => {
      if (m?.isAbsent) absent++;
      else if (m?.theoryObtained !== '' || m?.practicalObtained !== '') entered++;
    });
    return { absent, entered, total: students.length };
  }, [marks, students.length]);

  if (examLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px] text-gray-500 dark:text-gray-400">
        Loading exam…
      </div>
    );
  }
  if (!exam) {
    const forbidden = examError?.response?.status === 403;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/school/exams')}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to exams
          </button>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
            {forbidden
              ? examError?.response?.data?.message || 'You are not assigned to this exam class'
              : 'Exam not found.'}
          </div>
        </div>
      </div>
    );
  }
  if (!canEnter) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px] text-gray-500 dark:text-gray-400">
        You do not have permission to enter marks.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/school/exams/${examId}`)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to exam
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Enter Marks</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {exam.name} · {exam.class?.name} · {exam.academicYear}
              </p>
            </div>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                EXAM_STATUS_COLORS[exam.status] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {exam.status}
            </span>
          </div>

          {isLocked && (
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 rounded-lg text-purple-800 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" />
              This exam is published. Marks are locked. Unpublish to edit.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Subject Paper
              </label>
              <select
                value={examSubjectId}
                onChange={(e) => setExamSubjectId(e.target.value)}
                disabled={examSubjects.length === 0}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50 dark:disabled:bg-gray-800"
              >
                <option value="">Select subject...</option>
                {examSubjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.subject?.name} ({s.subject?.code}) — {formatDate(s.examDate)}
                  </option>
                ))}
              </select>
              {examSubjects.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isTeacherMode
                    ? 'Is exam mein aapka koi assigned subject nahi hai.'
                    : 'No subjects scheduled for this exam yet.'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Section
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={isTeacherMode && (!examSubjectId || sections.length === 0)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50 dark:disabled:bg-gray-800"
              >
                <option value="">Select section...</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {isTeacherMode && examSubjectId && sections.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Aap is subject ke liye kisi section ko assigned nahi hain.
                </p>
              )}
              {isTeacherMode && !examSubjectId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pehle subject chunein — sirf wahi sections dikhayi denge jin mein aap parhate
                  hain.
                </p>
              )}
            </div>
          </div>

          {examSubject && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Total" value={examSubject.totalMarks} />
              <Stat label="Passing" value={examSubject.passingMarks} />
              <Stat label="Theory Max" value={examSubject.theoryMarks ?? '—'} />
              <Stat label="Practical Max" value={examSubject.practicalMarks ?? '—'} />
            </div>
          )}
        </div>

        {!examSubjectId || !sectionId ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            Pick a subject paper and section to load the roster.
          </div>
        ) : studentsLoading || resultsLoading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            Loading roster…
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            No students in this section.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3 bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{counts.total}</strong> students ·{' '}
                <span className="text-gray-500 dark:text-gray-400">{counts.entered} entered</span> ·{' '}
                <span className="text-red-600">{counts.absent} absent</span>
              </div>
              <button
                onClick={handleSave}
                disabled={isLocked || enterMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {enterMutation.isPending ? 'Saving…' : 'Save Marks'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Roll</th>
                    <th className="px-4 py-3 text-left">Student</th>
                    {hasTheory && (
                      <th className="px-4 py-3 text-left">Theory ({examSubject.theoryMarks})</th>
                    )}
                    {hasPractical && (
                      <th className="px-4 py-3 text-left">
                        Practical ({examSubject.practicalMarks})
                      </th>
                    )}
                    {!hasTheory && !hasPractical && (
                      <th className="px-4 py-3 text-left">Marks ({examSubject.totalMarks})</th>
                    )}
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">%</th>
                    <th className="px-4 py-3 text-left">Grade</th>
                    <th className="px-4 py-3 text-center">Absent</th>
                    <th className="px-4 py-3 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const m = marks[s._id] || {};
                    const c = computedRow(s._id);
                    return (
                      <tr key={s._id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {s.rollNumber || '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                          <div className="font-medium">{s.user?.name || '—'}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {s.admissionNumber}
                          </div>
                        </td>
                        {hasTheory && (
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              max={examSubject.theoryMarks}
                              disabled={isLocked || m.isAbsent}
                              value={m.theoryObtained}
                              onChange={(e) =>
                                updateMark(s._id, { theoryObtained: e.target.value })
                              }
                              className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
                            />
                          </td>
                        )}
                        {hasPractical && (
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              max={examSubject.practicalMarks}
                              disabled={isLocked || m.isAbsent}
                              value={m.practicalObtained}
                              onChange={(e) =>
                                updateMark(s._id, { practicalObtained: e.target.value })
                              }
                              className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
                            />
                          </td>
                        )}
                        {!hasTheory && !hasPractical && (
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              max={examSubject.totalMarks}
                              disabled={isLocked || m.isAbsent}
                              value={m.theoryObtained}
                              onChange={(e) =>
                                updateMark(s._id, { theoryObtained: e.target.value })
                              }
                              className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
                            />
                          </td>
                        )}
                        <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                          {m.isAbsent ? '—' : c.total}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {m.isAbsent ? '—' : `${c.pct}%`}
                        </td>
                        <td className="px-4 py-2">
                          {m.isAbsent ? (
                            <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                          ) : (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                GRADE_COLORS[c.grade] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {c.grade}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            disabled={isLocked}
                            checked={!!m.isAbsent}
                            onChange={(e) => updateMark(s._id, { isAbsent: e.target.checked })}
                            className="w-4 h-4 accent-teal-600"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            disabled={isLocked}
                            placeholder="Optional"
                            value={m.remarks || ''}
                            onChange={(e) => updateMark(s._id, { remarks: e.target.value })}
                            className="w-40 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isLocked || enterMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {enterMutation.isPending ? 'Saving…' : 'Save Marks'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2">
      <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
    </div>
  );
}
