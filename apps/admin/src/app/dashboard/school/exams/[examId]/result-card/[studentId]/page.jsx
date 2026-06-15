'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import SchoolHeader from '../../../SchoolHeader';
import PrintStyles from '../../../printStyles';
import { GRADE_COLORS, formatDate } from '@/constants/exam';

export default function ResultCardPage() {
  const params = useParams();
  const router = useRouter();
  const { examId, studentId } = params;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const { data, isLoading } = useQuery({
    queryKey: ['result-card', examId, studentId],
    queryFn: () => fetchData({ url: `/exam/${examId}/result-card/${studentId}`, token }),
    enabled: !!token && !!examId && !!studentId,
  });
  const card = data?.data;

  const handlePrint = () => window.print();

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 p-6 text-gray-500">Loading result card…</div>;
  }
  if (!card) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-gray-500">Result card not available.</div>
    );
  }

  const { student, exam, subjects, summary } = card;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <PrintStyles />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4 no-print">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 print-area" id="printable">
          <SchoolHeader
            user={user}
            title="Student Result Card"
            subtitle={`${exam.name} · ${exam.academicYear}`}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Student Name" value={student.name} />
              <Info
                label="Class"
                value={`${student.class?.name || ''}${student.section?.name ? ' - ' + student.section.name : ''}`}
              />
              <Info label="Roll Number" value={student.rollNumber} />
              <Info label="Admission No." value={student.admissionNumber} />
              <Info label="Exam Type" value={exam.type} className="capitalize" />
              <Info
                label="Schedule"
                value={`${formatDate(exam.startDate)} → ${formatDate(exam.endDate)}`}
              />
            </div>
            <div className="flex justify-center md:justify-end">
              {student.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.photo}
                  alt={student.name}
                  className="w-32 h-40 object-cover border-2 border-gray-300 rounded-lg"
                />
              ) : (
                <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                  Photo
                </div>
              )}
            </div>
          </div>

          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="bg-gray-100 text-xs uppercase text-gray-700">
                <th className="border border-gray-300 px-2 py-2 text-left">Subject</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Total</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Theory</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Practical</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Obtained</th>
                <th className="border border-gray-300 px-2 py-2 text-right">%</th>
                <th className="border border-gray-300 px-2 py-2 text-center">Grade</th>
                <th className="border border-gray-300 px-2 py-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, idx) => (
                <tr key={s.subjectId || idx}>
                  <td className="border border-gray-300 px-2 py-2 font-medium">
                    {s.subject?.name}
                    {s.subject?.code && (
                      <span className="text-xs text-gray-500 ml-1">({s.subject.code})</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {s.examSubject?.totalMarks ?? '—'}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {s.theoryObtained ?? '—'}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {s.practicalObtained ?? '—'}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                    {s.isAbsent ? 'AB' : s.totalObtained}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {s.isAbsent ? '—' : `${s.percentage}%`}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    {s.isAbsent ? (
                      '—'
                    ) : (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          GRADE_COLORS[s.grade] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {s.grade}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    {s.isAbsent ? (
                      <span className="text-xs text-gray-500">Absent</span>
                    ) : s.isPassed ? (
                      <span className="text-green-700 font-semibold">Pass</span>
                    ) : (
                      <span className="text-red-700 font-semibold">Fail</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-300 px-2 py-2 text-right" colSpan={4}>
                  Grand Total
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {summary.totalObtained} / {summary.totalMarks}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {summary.percentage}%
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                      GRADE_COLORS[summary.grade] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {summary.grade}
                  </span>
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      summary.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {summary.isPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
            <Info
              label="Total Obtained"
              value={`${summary.totalObtained} / ${summary.totalMarks}`}
            />
            <Info label="Percentage" value={`${summary.percentage}%`} />
            <Info
              label="Position"
              value={
                summary.position ? `${summary.position} of ${summary.totalStudentsInSection}` : '—'
              }
            />
            <Info label="Failed Subjects" value={summary.failedSubjectsCount ?? 0} />
          </div>

          <div className="grid grid-cols-3 gap-8 mt-12 pt-6 text-sm">
            <Signature label="Class Teacher" />
            <Signature label="Principal" />
            <Signature label="Parent / Guardian" />
          </div>

          <div className="mt-8 text-xs text-gray-500 flex justify-between border-t border-gray-200 pt-3">
            <span>Generated on {new Date().toLocaleString()}</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> {exam.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, className = '' }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">{label}</p>
      <p className={`text-sm font-semibold text-gray-900 ${className}`}>{value || '—'}</p>
    </div>
  );
}

function Signature({ label }) {
  return (
    <div className="text-center">
      <div className="border-t border-gray-400 pt-2 text-xs text-gray-600">{label}</div>
    </div>
  );
}
