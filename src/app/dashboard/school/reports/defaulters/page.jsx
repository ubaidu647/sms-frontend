'use client';
import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  TrendingDown,
  X,
  Eye,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { hasAnyAction } from '@/utils/permissions';
import { formatDate, formatMoney, formatMonth, todayYMD } from '@/constants/fee';
import { useTranslations } from 'next-intl';

const inputCls =
  'px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function DefaultersReportPage() {
  const router = useRouter();
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const t = useTranslations('studentFeeDefaulters');

  const role = user?.role;
  const canRun =
    role?.isPredefined ||
    hasAnyAction(role, ['student-defaults-list-view', 'student-defaults-list-view-all-branch']);
  const canPickBranches =
    role?.isPredefined || hasAnyAction(role, ['student-defaults-list-view-all-branch']);

  // Draft state — user-editable; only applied when "Generate" is pressed.
  const [draftFrom, setDraftFrom] = useState(firstOfMonth());
  const [draftTo, setDraftTo] = useState(todayYMD());
  const [draftBranchIds, setDraftBranchIds] = useState([]);
  const [draftClassId, setDraftClassId] = useState('');
  const [draftSectionId, setDraftSectionId] = useState('');
  const [draftMinOutstanding, setDraftMinOutstanding] = useState('');
  const [draftIncludeDetails, setDraftIncludeDetails] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  // Applied state — the actual query input.
  const [applied, setApplied] = useState(null);
  const [filterError, setFilterError] = useState('');

  // Expandable row state (only used when includeDetails=true)
  const [expandedRows, setExpandedRows] = useState(() => new Set());

  // Excel/PDF/Print state
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printableRef = useRef(null);

  // Branch options (only relevant for multi-branch users)
  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canPickBranches && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Classes: filter by branch when there's exactly one chosen, otherwise show all the user can see
  const classBranchFilter =
    canPickBranches && draftBranchIds.length === 1 ? draftBranchIds[0] : undefined;

  const { data: classData } = useQuery({
    queryKey: ['classes-defaulters', classBranchFilter],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: classBranchFilter,
      }),
    enabled: !!token,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['sections-defaulters', draftClassId],
    queryFn: () => fetchData({ url: `/class/${draftClassId}/sections`, token }),
    enabled: !!token && !!draftClassId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  // Main report query — only fires once "Generate" sets `applied`
  const { data: reportEnvelope, isFetching } = useQuery({
    queryKey: ['defaulters', applied],
    queryFn: async () => {
      const params = {
        from: applied.from,
        to: applied.to,
      };
      if (applied.branchIds?.length) params.branchIds = applied.branchIds.join(',');
      if (applied.classId) params.classId = applied.classId;
      if (applied.sectionId) params.sectionId = applied.sectionId;
      if (applied.minOutstanding) params.minOutstanding = applied.minOutstanding;
      if (applied.includeDetails) params.includeDetails = 'true';
      const res = await apiClient.get('/fee/report/defaulters', { params });
      return res.data;
    },
    enabled: !!token && !!applied,
  });

  const report = reportEnvelope?.data;
  const rows = report?.rows || [];
  const byBranch = report?.byBranch || [];
  const totals = report?.totals;

  const handleGenerate = () => {
    setFilterError('');
    if (!draftFrom || !draftTo) {
      return setFilterError('Both From and To dates are required');
    }
    if (draftFrom > draftTo) {
      return setFilterError('From date must be before To date');
    }
    const minNum = draftMinOutstanding ? Number(draftMinOutstanding) : 0;
    if (draftMinOutstanding && (Number.isNaN(minNum) || minNum < 0)) {
      return setFilterError('Minimum outstanding must be a non-negative number');
    }
    setExpandedRows(new Set());
    setApplied({
      from: draftFrom,
      to: draftTo,
      branchIds: canPickBranches ? draftBranchIds : [],
      classId: draftClassId,
      sectionId: draftSectionId,
      minOutstanding: minNum,
      includeDetails: draftIncludeDetails,
    });
  };

  const handleClear = () => {
    setDraftFrom(firstOfMonth());
    setDraftTo(todayYMD());
    setDraftBranchIds([]);
    setDraftClassId('');
    setDraftSectionId('');
    setDraftMinOutstanding('');
    setDraftIncludeDetails(false);
    setApplied(null);
    setExpandedRows(new Set());
    setFilterError('');
  };

  const toggleBranch = (id) => {
    setDraftBranchIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleExpand = (studentId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handlePrint = () => window.print();

  const fileBase = useMemo(() => {
    if (!report) return 'Fee-Defaulters';
    return `Fee-Defaulters-${report.period?.from?.slice(0, 10)}_to_${report.period?.to?.slice(0, 10)}`;
  }, [report]);

  const handleExcel = () => {
    if (!report) return;
    const lines = [];
    lines.push(['Student Fee Defaulters Statement']);
    lines.push([`Period: ${formatDate(report.period.from)} to ${formatDate(report.period.to)}`]);
    lines.push([`Branches: ${(report.totals?.branchesCovered || []).join(', ') || 'All'}`]);
    lines.push([]);
    lines.push([
      'S/N',
      'Adm #',
      'Roll #',
      'Student',
      'Father',
      'Father Phone',
      'Class',
      'Section',
      'Branch',
      'Opening Months',
      'Opening',
      'Current Months',
      'Current',
      'Total Months',
      'Closing',
      'Oldest Due',
    ]);
    rows.forEach((r) => {
      lines.push([
        r.serialNumber,
        r.admissionNumber,
        r.rollNumber,
        r.studentName,
        r.fatherName || '',
        r.fatherPhone || '',
        r.className,
        r.sectionName,
        r.branchName,
        r.openingMonthsCount,
        r.openingBalance,
        r.currentPeriodMonthsCount,
        r.currentPeriodOutstanding,
        r.totalMonthsUnpaid,
        r.closingBalance,
        formatDate(r.oldestDueDate),
      ]);
    });
    if (totals) {
      lines.push([]);
      lines.push([
        '',
        '',
        '',
        'GRAND TOTAL',
        '',
        '',
        '',
        '',
        '',
        '',
        totals.openingTotal,
        '',
        totals.currentPeriodTotal,
        '',
        totals.closingTotal,
        '',
      ]);
    }
    if (byBranch.length > 1) {
      lines.push([]);
      lines.push(['Branch Totals']);
      lines.push(['Branch', 'Students', 'Opening', 'Current', 'Closing']);
      byBranch.forEach((b) => {
        lines.push([
          b.branchName,
          b.studentCount,
          b.openingTotal,
          b.currentPeriodTotal,
          b.closingTotal,
        ]);
      });
    }

    const csv = lines
      .map((row) =>
        row
          .map((cell) => {
            const v = cell == null ? '' : String(cell);
            return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(','),
      )
      .join('\n');

    // eslint-disable-next-line no-irregular-whitespace
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileBase}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePdf = async () => {
    if (!printableRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }
      pdf.save(`${fileBase}.pdf`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!canRun) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-red-200 rounded-2xl p-6 text-sm text-red-700 dark:text-red-400">
          You don&apos;t have permission to view this report.
        </div>
      </div>
    );
  }

  const branchLabel = canPickBranches
    ? draftBranchIds.length === 0
      ? 'All Branches'
      : draftBranchIds.length === 1
        ? branches.find((b) => b._id === draftBranchIds[0])?.name || '1 branch'
        : `${draftBranchIds.length} branches`
    : '';

  return (
    <div className="p-6 print:p-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingDown className="w-7 h-7 text-red-500" />
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 print:hidden">
          {filterError && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{filterError}</span>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                From<span className="text-red-500">*</span>
              </div>
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                To<span className="text-red-500">*</span>
              </div>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className={inputCls}
              />
            </div>

            {canPickBranches && (
              <div className="relative">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Branches
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBranchDropdownTouched(true);
                    setBranchDropdownOpen((p) => !p);
                  }}
                  className={`${inputCls} flex items-center gap-2 min-w-[180px]`}
                >
                  <span className="text-gray-700 dark:text-gray-300">{branchLabel}</span>
                  <ChevronDown className="w-4 h-4 ml-auto text-gray-500" />
                </button>
                {branchDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-72 max-h-64 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    {branches.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
                        No branches found
                      </div>
                    ) : (
                      branches.map((b) => {
                        const checked = draftBranchIds.includes(b._id);
                        return (
                          <label
                            key={b._id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBranch(b._id)}
                              className="accent-teal-600"
                            />
                            <span className="text-gray-800 dark:text-gray-200">{b.name}</span>
                          </label>
                        );
                      })
                    )}
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setDraftBranchIds([])}
                        className="text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setBranchDropdownOpen(false)}
                        className="text-teal-700 hover:underline"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Class
              </div>
              <select
                value={draftClassId}
                onChange={(e) => {
                  setDraftClassId(e.target.value);
                  setDraftSectionId('');
                }}
                className={inputCls}
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.grade ? `(Gr ${c.grade})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Section
              </div>
              <select
                value={draftSectionId}
                onChange={(e) => setDraftSectionId(e.target.value)}
                disabled={!draftClassId}
                className={inputCls}
              >
                <option value="">{draftClassId ? 'All Sections' : 'Pick class'}</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Min Outstanding ₨
              </div>
              <input
                type="number"
                min={0}
                value={draftMinOutstanding}
                onChange={(e) => setDraftMinOutstanding(e.target.value)}
                placeholder="0"
                className={`${inputCls} w-32`}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-1">
              <input
                type="checkbox"
                checked={draftIncludeDetails}
                onChange={(e) => setDraftIncludeDetails(e.target.checked)}
                className="accent-teal-600"
              />
              Show per-voucher details
            </label>

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
              >
                <X className="w-4 h-4" /> Clear
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isFetching}
                className="flex items-center gap-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" />
                {isFetching ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {!applied && (
          <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Pick a date range and click <strong>Generate</strong> to view the defaulters statement.
          </div>
        )}

        {applied && isFetching && !report && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading report…</div>
        )}

        {report && rows.length === 0 && (
          <div className="bg-white dark:bg-gray-900 border border-green-200 rounded-2xl p-10 text-center">
            <div className="text-lg font-semibold text-green-700 dark:text-green-400">
              No outstanding fees in this period 🎉
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Try widening the date range or removing filters.
            </div>
          </div>
        )}

        {report && rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-end gap-2 mb-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={handleExcel}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-emerald-300 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel (CSV)
              </button>
              <button
                onClick={handlePdf}
                disabled={downloadingPdf}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-red-300 text-red-700 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                {downloadingPdf ? 'Generating…' : 'PDF'}
              </button>
            </div>

            <div ref={printableRef}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4 print:shadow-none print:border-0 print:rounded-none">
                <div className="flex items-start justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      Statement
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Student Fee Defaulters
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Period: <strong>{formatDate(report.period.from)}</strong> →{' '}
                      <strong>{formatDate(report.period.to)}</strong>
                    </div>
                    {totals?.branchesCovered?.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Branches: {totals.branchesCovered.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      Students
                    </div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      {totals?.studentCount ?? rows.length}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <SummaryCard
                    label="Opening Balance"
                    value={totals?.openingTotal}
                    sub={`Arrears before ${formatDate(report.period.from)}`}
                    tone="amber"
                  />
                  <SummaryCard
                    label="Current Period"
                    value={totals?.currentPeriodTotal}
                    sub="Due within the selected window"
                    tone="blue"
                  />
                  <SummaryCard
                    label="Closing (Recoverable)"
                    value={totals?.closingTotal}
                    sub="Total amount to recover"
                    tone="red"
                    big
                  />
                </div>
              </div>

              {byBranch.length > 1 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 print:shadow-none print:border-0 print:rounded-none">
                  <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Branch Summary
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      <tr>
                        <th className="px-6 py-2 text-left">Branch</th>
                        <th className="px-6 py-2 text-right">Students</th>
                        <th className="px-6 py-2 text-right">Opening</th>
                        <th className="px-6 py-2 text-right">Current</th>
                        <th className="px-6 py-2 text-right">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byBranch.map((b) => (
                        <tr
                          key={b.branchId}
                          className="border-t border-gray-100 dark:border-gray-800"
                        >
                          <td className="px-6 py-2 text-gray-900 dark:text-gray-100 font-medium">
                            {b.branchName}
                          </td>
                          <td className="px-6 py-2 text-right text-gray-700 dark:text-gray-300">
                            {b.studentCount}
                          </td>
                          <td className="px-6 py-2 text-right text-amber-700">
                            {formatMoney(b.openingTotal)}
                          </td>
                          <td className="px-6 py-2 text-right text-blue-700">
                            {formatMoney(b.currentPeriodTotal)}
                          </td>
                          <td className="px-6 py-2 text-right font-semibold text-red-700">
                            {formatMoney(b.closingTotal)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <td className="px-6 py-2 font-bold text-gray-900 dark:text-gray-100">
                          TOTAL
                        </td>
                        <td className="px-6 py-2 text-right font-bold text-gray-900 dark:text-gray-100">
                          {totals?.studentCount}
                        </td>
                        <td className="px-6 py-2 text-right font-bold text-amber-700">
                          {formatMoney(totals?.openingTotal)}
                        </td>
                        <td className="px-6 py-2 text-right font-bold text-blue-700">
                          {formatMoney(totals?.currentPeriodTotal)}
                        </td>
                        <td className="px-6 py-2 text-right font-bold text-red-700">
                          {formatMoney(totals?.closingTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
                <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Defaulter List
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {rows.length} student(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      <tr>
                        {applied?.includeDetails && <th className="px-3 py-2 w-8 print:hidden" />}
                        <th className="px-3 py-2 text-left">S/N</th>
                        <th className="px-3 py-2 text-left">Student</th>
                        <th className="px-3 py-2 text-left">Father</th>
                        <th className="px-3 py-2 text-left">Class</th>
                        <th className="px-3 py-2 text-left">Branch</th>
                        <th className="px-3 py-2 text-right">Mo</th>
                        <th className="px-3 py-2 text-right">Opening</th>
                        <th className="px-3 py-2 text-right">Current</th>
                        <th className="px-3 py-2 text-right">Closing</th>
                        <th className="px-3 py-2 text-left">Oldest Due</th>
                        <th className="px-3 py-2 print:hidden"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const isOpen = expandedRows.has(r.studentId);
                        return (
                          <React.Fragment key={r.studentId}>
                            <tr className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                              {applied?.includeDetails && (
                                <td className="px-3 py-2 print:hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(r.studentId)}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                    aria-label={isOpen ? 'Collapse' : 'Expand'}
                                  >
                                    {isOpen ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                              )}
                              <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                                {r.serialNumber}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {r.photo ? (
                                    <img
                                      src={r.photo}
                                      alt=""
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                                      {r.studentName?.[0] || '?'}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                                      {r.studentName}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {r.admissionNumber}
                                      {r.rollNumber ? ` · Roll ${r.rollNumber}` : ''}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                <div className="truncate max-w-[160px]">{r.fatherName || '—'}</div>
                                {r.fatherPhone && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {r.fatherPhone}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                {r.className}
                                {r.sectionName ? ` · ${r.sectionName}` : ''}
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                {r.branchName}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                                {r.totalMonthsUnpaid}
                              </td>
                              <td className="px-3 py-2 text-right text-amber-700">
                                {formatMoney(r.openingBalance)}
                              </td>
                              <td className="px-3 py-2 text-right text-blue-700">
                                {formatMoney(r.currentPeriodOutstanding)}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-red-700">
                                {formatMoney(r.closingBalance)}
                              </td>
                              <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {formatDate(r.oldestDueDate)}
                              </td>
                              <td className="px-3 py-2 text-right print:hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/school/fees/vouchers/consolidated/${r.studentId}`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Slip
                                </button>
                              </td>
                            </tr>
                            {isOpen && applied?.includeDetails && (
                              <tr className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                                <td colSpan={12} className="px-6 py-3">
                                  <DetailVouchers vouchers={r.vouchers} />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {totals && (
                        <tr className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          <td
                            colSpan={applied?.includeDetails ? 7 : 6}
                            className="px-3 py-2 text-right font-bold text-gray-900 dark:text-gray-100"
                          >
                            GRAND TOTAL
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-amber-700">
                            {formatMoney(totals.openingTotal)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-blue-700">
                            {formatMoney(totals.currentPeriodTotal)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-red-700">
                            {formatMoney(totals.closingTotal)}
                          </td>
                          <td />
                          <td className="print:hidden" />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Print rules */}
      <style jsx global>{`
        @media print {
          body {
            font-size: 11px;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ label, value, sub, tone = 'gray', big }) {
  const toneMap = {
    amber: 'from-amber-500 to-amber-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-gray-500 to-gray-600',
  };
  return (
    <div className={`rounded-2xl p-5 shadow-sm bg-gradient-to-br ${toneMap[tone]} text-white`}>
      <div className="text-xs uppercase tracking-widest opacity-90">{label}</div>
      <div className={`${big ? 'text-4xl' : 'text-3xl'} font-bold mt-1`}>{formatMoney(value)}</div>
      {sub && <div className="text-xs opacity-80 mt-1">{sub}</div>}
    </div>
  );
}

function DetailVouchers({ vouchers }) {
  if (!vouchers?.length) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">No voucher details available.</div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="w-full text-xs">
        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          <tr>
            <th className="px-3 py-2 text-left">Bucket</th>
            <th className="px-3 py-2 text-left">Month</th>
            <th className="px-3 py-2 text-left">Voucher</th>
            <th className="px-3 py-2 text-left">Due</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2 text-right">Paid</th>
            <th className="px-3 py-2 text-right">Balance</th>
            <th className="px-3 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((v) => (
            <tr key={v._id} className="border-t border-gray-100 dark:border-gray-800">
              <td className="px-3 py-1.5">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    v.bucket === 'opening'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {v.bucket}
                </span>
              </td>
              <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">
                {formatMonth(v.month)}
              </td>
              <td className="px-3 py-1.5 font-mono text-[11px] text-gray-700 dark:text-gray-300">
                {v.voucherNumber}
              </td>
              <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">
                {formatDate(v.dueDate)}
              </td>
              <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">
                {formatMoney(v.totalAmount)}
              </td>
              <td className="px-3 py-1.5 text-right text-green-700">{formatMoney(v.paidAmount)}</td>
              <td className="px-3 py-1.5 text-right font-semibold text-red-700">
                {formatMoney(v.balanceAmount)}
              </td>
              <td className="px-3 py-1.5">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-gray-100 text-gray-700">
                  {v.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
