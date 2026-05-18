'use client';
import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import SchoolHeader from '../../SchoolHeader';
import PrintStyles from '../../printStyles';
import { formatDate } from '@/constants/exam';

export default function SectionSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const [sectionId, setSectionId] = useState('');

  const { data: examRes } = useQuery({
    queryKey: ['exam-detail', examId],
    queryFn: () => fetchData({ url: `/exam/${examId}`, token }),
    enabled: !!token && !!examId,
  });
  const exam = examRes?.data;
  const classId = exam?.class?._id || exam?.classId;

  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  const { data: summaryRes, isFetching } = useQuery({
    queryKey: ['section-summary', examId, sectionId],
    queryFn: () => fetchData({ url: `/exam/${examId}/section-summary`, token, sectionId }),
    enabled: !!token && !!examId && !!sectionId,
    staleTime: 0,
  });
  const summary = summaryRes?.data;
  const studentsRanked = summary?.students || [];
  const sectionMeta = useMemo(
    () => sections.find((s) => s._id === sectionId),
    [sections, sectionId],
  );

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <PrintStyles />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 no-print">
          <button
            onClick={() => router.push(`/dashboard/school/exams/${examId}`)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to exam
          </button>
          <button
            onClick={handlePrint}
            disabled={!summary}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4 no-print">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Section
          </label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full md:w-80 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
          >
            <option value="">Select section...</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {!sectionId ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm no-print">
            Pick a section to view the ranked summary.
          </div>
        ) : isFetching ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            Loading summary…
          </div>
        ) : !studentsRanked.length ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            No marks recorded for this section yet.
          </div>
        ) : (
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 print-area"
            id="printable"
          >
            <SchoolHeader
              user={user}
              title="Section Result Sheet"
              subtitle={`${exam?.name} · Class ${exam?.class?.name || ''} - Section ${
                sectionMeta?.name || ''
              } · ${exam?.academicYear}`}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-sm">
              <Stat label="Exam Type" value={exam?.type} />
              <Stat label="Total Marks" value={summary.totalMarks} />
              <Stat
                label="Schedule"
                value={`${formatDate(exam?.startDate)} → ${formatDate(exam?.endDate)}`}
              />
              <Stat label="Students" value={studentsRanked.length} />
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-xs uppercase text-gray-700 dark:text-gray-300">
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left">
                    #
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left">
                    Roll
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left">
                    Adm No.
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left">
                    Name
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-right">
                    Total
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-right">
                    %
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">
                    Failed
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentsRanked.map((s) => (
                  <tr
                    key={s.studentId}
                    className={
                      !s.isPassed
                        ? 'bg-red-50 dark:bg-red-950/40'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  >
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 font-bold">
                      {s.position}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                      {s.rollNumber || '—'}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {s.admissionNumber || '—'}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 font-medium">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/school/exams/${examId}/result-card/${s.studentId}`,
                          )
                        }
                        className="text-teal-700 dark:text-teal-400 hover:underline text-left"
                        title="View result card"
                      >
                        {s.name}
                      </button>
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-right">
                      {s.totalObtained} / {summary.totalMarks}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-right">
                      {s.percentage}%
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">
                      {s.failedCount ?? 0}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          s.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.isPassed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 text-xs text-gray-500 dark:text-gray-400 flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
              <span>Generated on {new Date().toLocaleString()}</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> {exam?.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
        {value ?? '—'}
      </p>
    </div>
  );
}
