'use client';
import React, { useMemo, useRef, useState } from 'react';
import { FileText, Download, Printer, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { hasAnyAction } from '@/utils/permissions';
import { todayYMD } from '@/constants/fee';
import { useProgressReport } from './hooks/useProgressReport';
import StudentPickerInline from './StudentPickerInline';
import ReportDocument from './ReportDocument';

const MODULES = [
  'attendance',
  'exams',
  'homework',
  'fees',
  'transport',
  'timetable',
  'announcements',
];
const DEFAULT_MODULES = ['attendance', 'exams', 'homework', 'fees'];

function oneMonthAgoYMD() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900';
const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';

export default function StudentProgressReportPage() {
  const t = useTranslations('reportStudentProgress');
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const canRun =
    user?.role?.isPredefined ||
    hasAnyAction(user?.role, ['view-student', 'view-all-branch-student']);

  const [student, setStudent] = useState(null); // { studentId, label, branchId }
  const [fromDate, setFromDate] = useState(oneMonthAgoYMD());
  const [toDate, setToDate] = useState(todayYMD());
  const [selected, setSelected] = useState(() => new Set(DEFAULT_MODULES));
  const [generatedAt, setGeneratedAt] = useState('');

  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const mutation = useProgressReport();
  const report = mutation.data;

  const branchId = student?.branchId || user?.branchId || user?.branch?._id || null;
  const { data: profileData } = useQuery({
    queryKey: ['branch-profile', 'branch', branchId],
    queryFn: async () => (await apiClient.get(`/branch-profile/branch/${branchId}`)).data,
    enabled: !!token && !!branchId,
  });
  const profile = profileData?.data || null;

  const dateInvalid = fromDate && toDate && fromDate > toDate;
  const canGenerate =
    !!student?.studentId && !!fromDate && !!toDate && !dateInvalid && selected.size > 0;

  const toggleModule = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleGenerate = () => {
    if (!canGenerate) return;
    mutation.mutate(
      {
        studentId: student.studentId,
        fromDate,
        toDate,
        modules: MODULES.filter((m) => selected.has(m)),
      },
      {
        onSuccess: () => setGeneratedAt(new Date().toLocaleString()),
        onError: (err) =>
          toast.error(err?.response?.data?.message || err?.message || 'Failed to generate report'),
      },
    );
  };

  const handleDownloadPdf = async () => {
    if (!printableRef.current || downloadingPdf || !report) return;
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);
      const filename = `Progress-${report.student?.name || 'student'}.pdf`.replace(/\s+/g, '-');
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const footerBand = 8; // reserved strip so content never overlaps the footer
      const usable = pageHeight - margin * 2 - footerBand;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= usable;
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= usable;
      }

      // Per-page footer: generation time (left), page x/y (center),
      // school name + "Powered by nodeCampus.online" (right).
      const total = pdf.getNumberOfPages();
      const stamp = `Generated ${generatedAt || new Date().toLocaleString()}`;
      const school = profile?.displayName || report.student?.className || 'School';
      const y = pageHeight - 4;
      for (let p = 1; p <= total; p++) {
        pdf.setPage(p);
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(stamp, margin, y);
        pdf.text(`Page ${p} / ${total}`, pageWidth / 2, y, { align: 'center' });
        pdf.text(`${school} — Powered by nodeCampus.online`, pageWidth - margin, y, {
          align: 'right',
        });
      }
      pdf.save(filename);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const moduleLabel = (key) => {
    try {
      return t(`modules.${key}`);
    } catch {
      return key;
    }
  };

  const generatedStamp = useMemo(() => generatedAt || new Date().toLocaleString(), [generatedAt]);

  if (!canRun) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('accessDenied')}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Header + actions */}
        <div className="flex items-start justify-between gap-4 mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" /> {t('title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          {report && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Printer className="w-4 h-4" /> {t('print')}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {downloadingPdf ? t('generatingPdf') : t('downloadPdf')}
              </button>
            </div>
          )}
        </div>

        {/* Builder */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className={labelCls}>
                {t('selectStudent')}
                <span className="text-red-500"> *</span>
              </label>
              <StudentPickerInline
                value={student?.studentId}
                label={student?.label}
                placeholder={t('studentPlaceholder')}
                onSelect={setStudent}
                onClear={() => setStudent(null)}
              />
            </div>
            <div>
              <label className={labelCls}>{t('fromDate')}</label>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{t('toDate')}</label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex items-end">
              {dateInvalid && <p className="text-xs text-red-600">{t('dateRangeError')}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>{t('selectModules')}</label>
            <div className="flex flex-wrap gap-2">
              {MODULES.map((m) => {
                const checked = selected.has(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleModule(m)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      checked
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {moduleLabel(m)}
                  </button>
                );
              })}
            </div>
            {selected.size === 0 && (
              <p className="text-xs text-red-600 mt-1">{t('moduleRequired')}</p>
            )}
          </div>

          <div className="mt-5">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || mutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {mutation.isPending ? t('generating') : t('generate')}
            </button>
          </div>
        </div>

        {/* Report */}
        {report ? (
          <div ref={printableRef}>
            <ReportDocument
              data={report}
              profile={profile}
              branchName={profile?.displayName}
              generatedAt={generatedStamp}
            />
          </div>
        ) : (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-16 print:hidden">
            {t('emptyState')}
          </div>
        )}
      </div>
    </div>
  );
}
