'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import toast from 'react-hot-toast';
import { Save, CheckCircle2, CalendarDays, Search, X } from 'lucide-react';

const STATUS_CONFIG = [
  {
    value: 'present',
    label: 'Present',
    color: 'bg-green-100 text-green-800 border-green-300',
    activeColor: 'bg-green-600 text-white border-green-700',
  },
  {
    value: 'absent',
    label: 'Absent',
    color: 'bg-red-100 text-red-800 border-red-300',
    activeColor: 'bg-red-600 text-white border-red-700',
  },
  {
    value: 'late',
    label: 'Late',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    activeColor: 'bg-yellow-500 text-white border-yellow-600',
  },
  {
    value: 'half-day',
    label: 'Half-day',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    activeColor: 'bg-orange-500 text-white border-orange-600',
  },
  {
    value: 'leave',
    label: 'Leave',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    activeColor: 'bg-blue-600 text-white border-blue-700',
  },
  {
    value: 'holiday',
    label: 'Holiday',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    activeColor: 'bg-gray-600 text-white border-gray-700',
  },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export default function MarkAttendancePanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canMark =
    isAdmin ||
    actions.includes('mark-attendance') ||
    actions.includes('mark-all-branch-attendance');
  const isOrgLevel =
    isAdmin ||
    actions.includes('view-all-branch-attendance') ||
    actions.includes('mark-all-branch-attendance');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  // Filters — draft state holds in-progress UI values; applied state drives the roster query.
  const [draftDate, setDraftDate] = useState(todayISO());
  const [draftAcademicYear, setDraftAcademicYear] = useState(currentAcademicYear());
  const [draftBranchId, setDraftBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [draftClassId, setDraftClassId] = useState('');
  const [draftSectionId, setDraftSectionId] = useState('');

  const [date, setDate] = useState(todayISO());
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [_branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');

  const applyFilters = () => {
    setDate(draftDate);
    setAcademicYear(draftAcademicYear);
    setBranchId(draftBranchId);
    setClassId(draftClassId);
    setSectionId(draftSectionId);
  };

  const clearFilters = () => {
    const t = todayISO();
    const ay = currentAcademicYear();
    const bId = isOrgLevel ? '' : userBranchId;
    setDraftDate(t);
    setDraftAcademicYear(ay);
    setDraftBranchId(bId);
    setDraftClassId('');
    setDraftSectionId('');
    setDate(t);
    setAcademicYear(ay);
    setBranchId(bId);
    setClassId('');
    setSectionId('');
  };

  // Per-student state — keyed by studentId
  const [entries, setEntries] = useState({});

  // Load branches for org-level
  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const draftEffectiveBranchId = isOrgLevel ? draftBranchId : userBranchId;

  // Classes — cascade off both draftBranchId and draftAcademicYear so the dropdown
  // refreshes immediately when either changes (no Search click required).
  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', draftEffectiveBranchId, draftAcademicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: draftEffectiveBranchId,
        academicYear: draftAcademicYear,
      }),
    enabled: !!token && !!draftEffectiveBranchId && !!draftAcademicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  // Sections — driven by draftClassId so it cascades on selection without waiting for Search.
  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', draftClassId],
    queryFn: () => fetchData({ url: `/class/${draftClassId}/sections`, token }),
    enabled: !!token && !!draftClassId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  // Reset cascade on draft side — clear class/section when branch or academic year changes.
  useEffect(() => {
    setDraftClassId('');
    setDraftSectionId('');
  }, [draftEffectiveBranchId, draftAcademicYear]);
  useEffect(() => {
    setDraftSectionId('');
  }, [draftClassId]);

  // Daily roster
  const dailyKey = ['attendance-daily', classId, sectionId, date];
  const { data: dailyData, isFetching: dailyLoading } = useQuery({
    queryKey: dailyKey,
    queryFn: () =>
      fetchData({
        url: '/attendance/section/daily',
        token,
        classId,
        sectionId,
        date,
      }),
    enabled: !!token && !!classId && !!sectionId && !!date,
    staleTime: 0,
  });

  const roster = useMemo(() => dailyData?.data?.roster || [], [dailyData]);
  const summary = dailyData?.data?.summary;

  // Initialize entries when roster loads
  useEffect(() => {
    if (!roster.length) {
      setEntries({});
      return;
    }
    const initial = {};
    roster.forEach((s) => {
      initial[s.studentId] = {
        status: s.attendance?.status || 'present',
        reason: s.attendance?.reason || '',
        arrivalTime: s.attendance?.arrivalTime || '',
        departureTime: s.attendance?.departureTime || '',
        notes: s.attendance?.notes || '',
        markedId: s.attendance?._id || null,
      };
    });
    setEntries(initial);
  }, [roster]);

  const updateEntry = (studentId, patch) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], ...patch },
    }));
  };

  const setAllStatuses = (status) => {
    setEntries((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status };
      });
      return next;
    });
  };

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, 'half-day': 0, leave: 0, holiday: 0 };
    Object.values(entries).forEach((e) => {
      if (c[e.status] != null) c[e.status]++;
    });
    return c;
  }, [entries]);

  const markMutation = useMutation({
    mutationFn: (payload) => postData({ url: '/attendance/mark', payload, token }),
    onSuccess: (res) => {
      const { created = 0, updated = 0 } = res?.data || {};
      toast.success(`Saved — ${created} created, ${updated} updated`);
      queryClient.invalidateQueries({ queryKey: dailyKey });
    },
    onError: (err) => toast.error(err.message || 'Failed to mark attendance'),
  });

  const handleSubmit = () => {
    if (!classId || !sectionId || !date || !academicYear) {
      toast.error('Please pick class, section, date and academic year');
      return;
    }
    if (!roster.length) {
      toast.error('No students in roster');
      return;
    }
    const payloadEntries = roster.map((s) => {
      const e = entries[s.studentId] || { status: 'present' };
      const entry = { studentId: s.studentId, status: e.status };
      if (e.reason) entry.reason = e.reason;
      if (e.status === 'late' && e.arrivalTime) entry.arrivalTime = e.arrivalTime;
      if (e.status === 'half-day' && e.departureTime) entry.departureTime = e.departureTime;
      if (e.notes) entry.notes = e.notes;
      return entry;
    });
    markMutation.mutate({ classId, sectionId, date, academicYear, entries: payloadEntries });
  };

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {isOrgLevel && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Branch
              </label>
              <select
                value={draftBranchId}
                onChange={(e) => setDraftBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
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
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Academic Year
            </label>
            <input
              value={draftAcademicYear}
              onChange={(e) => setDraftAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Class
            </label>
            <select
              value={draftClassId}
              onChange={(e) => setDraftClassId(e.target.value)}
              disabled={!draftEffectiveBranchId}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
            >
              <option value="">
                {draftEffectiveBranchId ? 'Select class...' : 'Select branch first'}
              </option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.grade ? `(Grade ${c.grade})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Section
            </label>
            <select
              value={draftSectionId}
              onChange={(e) => setDraftSectionId(e.target.value)}
              disabled={!draftClassId}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
            >
              <option value="">{draftClassId ? 'Select section...' : 'Select class first'}</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.currentStrength}/{s.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Date
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="date"
                value={draftDate}
                max={todayISO()}
                onChange={(e) => setDraftDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={applyFilters}
            className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Empty state */}
      {(!classId || !sectionId) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <ClipboardEmpty />
          <p className="text-gray-500 dark:text-gray-400 mt-3">
            Select a class, section and date to load the roster.
          </p>
        </div>
      )}

      {/* Loading */}
      {classId && sectionId && dailyLoading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Roster */}
      {classId && sectionId && !dailyLoading && roster.length > 0 && (
        <>
          {/* Summary banner */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {STATUS_CONFIG.filter((s) => s.value !== 'holiday').map((s) => (
                  <div key={s.value} className={`px-3 py-1.5 rounded-lg border ${s.color}`}>
                    <span className="font-semibold capitalize">{s.label}</span>
                    <span className="ml-2 font-bold">{counts[s.value] || 0}</span>
                  </div>
                ))}
                <div className="px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Total</span>
                  <span className="ml-2 font-bold">{roster.length}</span>
                </div>
              </div>
              {summary?.unmarked != null && summary.unmarked === 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  All marked
                </span>
              )}
            </div>
          </div>

          {/* Quick actions */}
          {canMark && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-1">
                Quick actions:
              </span>
              <button
                onClick={() => setAllStatuses('present')}
                className="px-3 py-1.5 text-xs font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 rounded-lg hover:bg-green-100"
              >
                Mark all Present
              </button>
              <button
                onClick={() => setAllStatuses('holiday')}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Holiday Today
              </button>
              <button
                onClick={() => setAllStatuses('absent')}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 rounded-lg hover:bg-red-100"
              >
                Mark all Absent
              </button>
            </div>
          )}

          {/* Roster list */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-16">
                    Roll
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-72">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s) => {
                  const e = entries[s.studentId] || { status: 'present' };
                  const isLate = e.status === 'late';
                  const isHalfDay = e.status === 'half-day';
                  const needsReason = ['absent', 'leave', 'half-day', 'late'].includes(e.status);
                  const initials =
                    (s.name || '')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join('') || '?';
                  return (
                    <tr
                      key={s.studentId}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {s.rollNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.photo}
                              alt={s.name}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 dark:text-teal-400 font-semibold text-xs flex items-center justify-center">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                              {s.name}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {s.admissionNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {STATUS_CONFIG.map((cfg) => {
                            const active = e.status === cfg.value;
                            return (
                              <button
                                key={cfg.value}
                                onClick={() =>
                                  canMark && updateEntry(s.studentId, { status: cfg.value })
                                }
                                disabled={!canMark}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                  active ? cfg.activeColor : cfg.color + ' hover:opacity-80'
                                } ${!canMark ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {isLate && (
                            <input
                              type="time"
                              value={e.arrivalTime || ''}
                              onChange={(ev) =>
                                updateEntry(s.studentId, { arrivalTime: ev.target.value })
                              }
                              disabled={!canMark}
                              className="w-28 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
                              placeholder="Arrival"
                            />
                          )}
                          {isHalfDay && (
                            <input
                              type="time"
                              value={e.departureTime || ''}
                              onChange={(ev) =>
                                updateEntry(s.studentId, { departureTime: ev.target.value })
                              }
                              disabled={!canMark}
                              className="w-28 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
                              placeholder="Departure"
                            />
                          )}
                          {needsReason && (
                            <input
                              type="text"
                              value={e.reason || ''}
                              onChange={(ev) =>
                                updateEntry(s.studentId, { reason: ev.target.value })
                              }
                              disabled={!canMark}
                              placeholder="Reason (optional)"
                              className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-teal-500"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save */}
          {canMark && (
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={markMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                {markMutation.isPending ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          )}
        </>
      )}

      {/* No students */}
      {classId && sectionId && !dailyLoading && roster.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No students enrolled in this section.</p>
        </div>
      )}
    </div>
  );
}

function ClipboardEmpty() {
  return (
    <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <CalendarDays className="w-7 h-7 text-gray-400 dark:text-gray-500" />
    </div>
  );
}
