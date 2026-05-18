'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import toast from 'react-hot-toast';
import { Save, CheckCircle2, CalendarDays, Search, X } from 'lucide-react';
import { STATUS_CONFIG, STAFF_LEAVE_TYPES, STAFF_TYPES } from '@/constants/staffAttendance';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const NEEDS_REASON = ['absent', 'leave', 'half-day', 'late'];
const ALLOWS_TIMES = ['present', 'late', 'half-day'];

export default function MarkStaffAttendancePanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canMark =
    isAdmin ||
    actions.includes('mark-staff-attendance') ||
    actions.includes('mark-all-branch-staff-attendance');
  const isOrgLevel =
    isAdmin ||
    actions.includes('view-all-branch-staff-attendance') ||
    actions.includes('mark-all-branch-staff-attendance');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  // Filters — draft state holds in-progress UI values; applied state drives the roster query.
  const [draftDate, setDraftDate] = useState(todayISO());
  const [draftBranchId, setDraftBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [draftStaffType, setDraftStaffType] = useState('');

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [staffType, setStaffType] = useState('');

  const applyFilters = () => {
    setDate(draftDate);
    setBranchId(draftBranchId);
    setStaffType(draftStaffType);
  };

  const clearFilters = () => {
    const t = todayISO();
    const bId = isOrgLevel ? '' : userBranchId;
    setDraftDate(t);
    setDraftBranchId(bId);
    setDraftStaffType('');
    setDate(t);
    setBranchId(bId);
    setStaffType('');
  };

  const [entries, setEntries] = useState({});

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const dailyKey = ['staff-attendance-daily', effectiveBranchId, date, staffType];
  const { data: dailyData, isFetching: dailyLoading } = useQuery({
    queryKey: dailyKey,
    queryFn: () =>
      fetchData({
        url: '/staff-attendance/branch/daily',
        token,
        branchId: effectiveBranchId,
        date,
        staffType: staffType || undefined,
      }),
    enabled: !!token && !!effectiveBranchId && !!date,
    staleTime: 0,
  });

  const roster = useMemo(() => dailyData?.data?.roster || [], [dailyData]);
  const summary = dailyData?.data?.summary;

  useEffect(() => {
    if (!roster.length) {
      setEntries({});
      return;
    }
    const initial = {};
    roster.forEach((s) => {
      initial[s.staffId] = {
        status: s.attendance?.status || 'present',
        reason: s.attendance?.reason || '',
        leaveType: s.attendance?.leaveType || '',
        isPaid: s.attendance?.isPaid !== false,
        arrivalTime: s.attendance?.arrivalTime || '',
        departureTime: s.attendance?.departureTime || '',
        notes: s.attendance?.notes || '',
        markedId: s.attendance?._id || null,
      };
    });
    setEntries(initial);
  }, [roster]);

  const updateEntry = (staffId, patch) => {
    setEntries((prev) => {
      const cur = prev[staffId] || { status: 'present' };
      let next = { ...cur, ...patch };
      if (patch.status && patch.status !== 'leave') {
        next.leaveType = '';
      }
      if (patch.status && !ALLOWS_TIMES.includes(patch.status)) {
        next.arrivalTime = '';
        next.departureTime = '';
      }
      return { ...prev, [staffId]: next };
    });
  };

  const setAllStatuses = (status) => {
    setEntries((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = {
          ...next[id],
          status,
          ...(status !== 'leave' ? { leaveType: '' } : {}),
          ...(ALLOWS_TIMES.includes(status) ? {} : { arrivalTime: '', departureTime: '' }),
        };
      });
      return next;
    });
  };

  const setUnmarkedTo = (status) => {
    setEntries((prev) => {
      const next = { ...prev };
      roster.forEach((s) => {
        if (!s.attendance) {
          next[s.staffId] = {
            ...next[s.staffId],
            status,
            ...(status !== 'leave' ? { leaveType: '' } : {}),
            ...(ALLOWS_TIMES.includes(status) ? {} : { arrivalTime: '', departureTime: '' }),
          };
        }
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
    mutationFn: (payload) => postData({ url: '/staff-attendance/mark', payload, token }),
    onSuccess: (res) => {
      const { created = 0, updated = 0 } = res?.data || {};
      toast.success(`Saved — ${created} created, ${updated} updated`);
      queryClient.invalidateQueries({ queryKey: dailyKey });
    },
    onError: (err) => toast.error(err.message || 'Failed to mark attendance'),
  });

  const handleSubmit = () => {
    if (!effectiveBranchId || !date) {
      toast.error('Please pick a branch and date');
      return;
    }
    if (!roster.length) {
      toast.error('No staff in roster');
      return;
    }
    const payloadEntries = [];
    for (const s of roster) {
      const e = entries[s.staffId] || { status: 'present' };
      const entry = { staffId: s.staffId, status: e.status };

      if (e.status === 'leave') {
        if (!e.leaveType) {
          toast.error(`Leave type is required for ${s.name}`);
          return;
        }
        entry.leaveType = e.leaveType;
        entry.isPaid = !!e.isPaid;
      }
      if (ALLOWS_TIMES.includes(e.status)) {
        if (e.arrivalTime) entry.arrivalTime = e.arrivalTime;
        if (e.departureTime) entry.departureTime = e.departureTime;
        if (entry.arrivalTime && entry.departureTime && entry.departureTime <= entry.arrivalTime) {
          toast.error(`Departure must be after arrival for ${s.name}`);
          return;
        }
      }
      if (e.reason?.trim()) entry.reason = e.reason.trim();
      if (e.notes?.trim()) entry.notes = e.notes.trim();

      payloadEntries.push(entry);
    }

    markMutation.mutate({
      branchId: effectiveBranchId,
      date,
      entries: payloadEntries,
    });
  };

  const allHoliday = summary && summary.holiday === summary.totalStaff && summary.totalStaff > 0;

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              Staff Type
            </label>
            <select
              value={draftStaffType}
              onChange={(e) => setDraftStaffType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 capitalize"
            >
              <option value="">All</option>
              {STAFF_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
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

      {!effectiveBranchId && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-3">
            Select a branch to load the staff roster.
          </p>
        </div>
      )}

      {effectiveBranchId && dailyLoading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {effectiveBranchId && !dailyLoading && roster.length > 0 && (
        <>
          {allHoliday && (
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
              All staff marked <strong>holiday</strong> for {date}.
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {STATUS_CONFIG.map((s) => (
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
              {summary?.unmarked === 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  All marked
                </span>
              )}
            </div>
          </div>

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
                onClick={() => setUnmarkedTo('present')}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 border border-green-200 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/40"
              >
                Unmarked → Present
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

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Staff
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Designation
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-96">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s) => {
                  const e = entries[s.staffId] || { status: 'present' };
                  const allowsTimes = ALLOWS_TIMES.includes(e.status);
                  const needsReason = NEEDS_REASON.includes(e.status);
                  const isLeave = e.status === 'leave';
                  const initials =
                    (s.name || '')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join('') || '?';
                  return (
                    <tr
                      key={s.staffId}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.photo ? (
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
                              {s.serialNumber}
                              {s.staffType && (
                                <span className="ml-2 capitalize">· {s.staffType}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {s.designation || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {STATUS_CONFIG.map((cfg) => {
                            const active = e.status === cfg.value;
                            return (
                              <button
                                key={cfg.value}
                                onClick={() =>
                                  canMark && updateEntry(s.staffId, { status: cfg.value })
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
                          {allowsTimes && (
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={e.arrivalTime || ''}
                                onChange={(ev) =>
                                  updateEntry(s.staffId, { arrivalTime: ev.target.value })
                                }
                                disabled={!canMark}
                                className="w-28 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
                                placeholder="Arrival"
                                title="Arrival"
                              />
                              <input
                                type="time"
                                value={e.departureTime || ''}
                                onChange={(ev) =>
                                  updateEntry(s.staffId, { departureTime: ev.target.value })
                                }
                                disabled={!canMark}
                                className="w-28 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
                                placeholder="Departure"
                                title="Departure"
                              />
                            </div>
                          )}
                          {isLeave && (
                            <div className="flex gap-2 items-center">
                              <select
                                value={e.leaveType || ''}
                                onChange={(ev) =>
                                  updateEntry(s.staffId, { leaveType: ev.target.value })
                                }
                                disabled={!canMark}
                                className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 capitalize"
                              >
                                <option value="">Leave type...</option>
                                {STAFF_LEAVE_TYPES.map((lt) => (
                                  <option key={lt} value={lt} className="capitalize">
                                    {lt}
                                  </option>
                                ))}
                              </select>
                              <label className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={!!e.isPaid}
                                  onChange={(ev) =>
                                    updateEntry(s.staffId, { isPaid: ev.target.checked })
                                  }
                                  disabled={!canMark}
                                />
                                Paid
                              </label>
                            </div>
                          )}
                          {needsReason && (
                            <input
                              type="text"
                              value={e.reason || ''}
                              onChange={(ev) => updateEntry(s.staffId, { reason: ev.target.value })}
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

      {effectiveBranchId && !dailyLoading && roster.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No active staff in this branch.</p>
        </div>
      )}
    </div>
  );
}
