'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

function startOfWeekMonday(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay();
  const diff = (day + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  return dt;
}

function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatRange(start, end) {
  const sm = start.toLocaleString('en', { month: 'short' });
  const em = end.toLocaleString('en', { month: 'short' });
  const sy = start.getFullYear();
  const ey = end.getFullYear();
  if (sy === ey && sm === em)
    return `${sm} ${start.getDate()} – ${end.getDate()}, ${sy}`;
  if (sy === ey)
    return `${sm} ${start.getDate()} – ${em} ${end.getDate()}, ${sy}`;
  return `${sm} ${start.getDate()}, ${sy} – ${em} ${end.getDate()}, ${ey}`;
}

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

const STATUS_BADGE = {
  present: 'bg-green-500 text-white',
  absent: 'bg-red-500 text-white',
  late: 'bg-yellow-500 text-white',
  'half-day': 'bg-orange-500 text-white',
  leave: 'bg-blue-500 text-white',
  holiday: 'bg-gray-400 text-white',
};

const STATUS_LABEL = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  'half-day': 'Half',
  leave: 'Leave',
  holiday: 'Holiday',
};

const VIEW_OPTIONS = ['Year', 'Week', 'Month', 'Day'];

export default function CalendarViewPanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel =
    isAdmin || actions.includes('view-all-branch-attendance');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(new Date()),
  );
  const [view, setView] = useState('Week');

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekEnd = days[6];

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () =>
      fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];
  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', effectiveBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: effectiveBranchId,
        academicYear,
      }),
    enabled: !!token && !!effectiveBranchId && !!academicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  useEffect(() => {
    setClassId('');
    setSectionId('');
  }, [effectiveBranchId, academicYear]);
  useEffect(() => {
    setSectionId('');
  }, [classId]);

  const dayQueries = useQueries({
    queries: days.map((d) => ({
      queryKey: ['attendance-daily', classId, sectionId, toISO(d)],
      queryFn: () =>
        fetchData({
          url: '/attendance/section/daily',
          token,
          classId,
          sectionId,
          date: toISO(d),
        }),
      enabled: !!token && !!classId && !!sectionId,
      staleTime: 30000,
    })),
  });

  const isLoading = dayQueries.some((q) => q.isFetching);

  const { students, statusMap } = useMemo(() => {
    const map = {};
    const seen = new Map();
    dayQueries.forEach((q, idx) => {
      const roster = q?.data?.data?.roster || [];
      const iso = toISO(days[idx]);
      roster.forEach((r) => {
        const sid = r.studentId;
        if (!seen.has(sid))
          seen.set(sid, {
            studentId: sid,
            name: r.name,
            rollNumber: r.rollNumber,
            admissionNumber: r.admissionNumber,
            photo: r.photo,
          });
        if (!map[sid]) map[sid] = {};
        if (r.attendance?.status) map[sid][iso] = r.attendance.status;
      });
    });
    return {
      students: Array.from(seen.values()).sort(
        (a, b) =>
          Number(a.rollNumber || 0) - Number(b.rollNumber || 0) ||
          (a.name || '').localeCompare(b.name || ''),
      ),
      statusMap: map,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayQueries.map((q) => q.dataUpdatedAt).join('|'), days]);

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {isOrgLevel && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500"
              >
                <option value="">Select branch...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Academic Year
            </label>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Class
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={!effectiveBranchId}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500 disabled:bg-gray-50"
            >
              <option value="">
                {effectiveBranchId ? 'Select class...' : 'Select branch first'}
              </option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.grade ? `(Grade ${c.grade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Section
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!classId}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500 disabled:bg-gray-50"
            >
              <option value="">
                {classId ? 'Select section...' : 'Select class first'}
              </option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.currentStrength}/{s.capacity})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap">
          <button
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
            className="px-5 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50 shadow-sm"
          >
            Today
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-base font-semibold text-gray-900 min-w-[160px] text-center">
              {formatRange(days[0], weekEnd)}
            </div>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex bg-gray-100 rounded-full p-1">
            {VIEW_OPTIONS.map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    active
                      ? 'bg-white shadow-sm text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-auto scrollbar-hide border-t border-gray-100 max-h-[calc(100vh-420px)]">
          {(!classId || !sectionId) ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              Pick a class and section to load the week.
            </div>
          ) : isLoading && students.length === 0 ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No students enrolled in this section.
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="sticky left-0 bg-white border-b border-r border-gray-100 px-4 py-3 w-44 text-center align-middle">
                    <Clock className="w-5 h-5 text-teal-600 mx-auto" />
                  </th>
                  {days.map((d, i) => (
                    <th
                      key={i}
                      className="border-b border-r border-gray-100 px-3 py-3 text-center"
                    >
                      <div className="text-sm font-bold text-teal-700">
                        {d.toLocaleDateString('en', { weekday: 'long' })}
                      </div>
                      <div className="text-base font-semibold text-gray-700 mt-0.5">
                        {d.getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId} className="hover:bg-gray-50/40">
                    <td className="sticky left-0 bg-white hover:bg-gray-50/40 border-b border-r border-gray-100 px-4 py-3 align-middle">
                      <div className="text-xs font-semibold text-teal-600">
                        Roll {s.rollNumber}
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                        {s.name}
                      </div>
                    </td>
                    {days.map((d, di) => {
                      const status = statusMap[s.studentId]?.[toISO(d)];
                      return (
                        <td
                          key={di}
                          className="border-b border-r border-gray-100 px-3 py-3 text-center align-middle h-[60px]"
                        >
                          {status ? (
                            <span
                              className={`inline-block px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm ${
                                STATUS_BADGE[status] || 'bg-gray-300 text-white'
                              }`}
                            >
                              {STATUS_LABEL[status] || status}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
