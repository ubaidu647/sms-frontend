'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import toast from 'react-hot-toast';
import { Save, AlertCircle } from 'lucide-react';
import {
  DAY_LABELS,
  PERIOD_TYPE_COLORS,
  currentAcademicYear,
} from '@/constants/timetable';

export default function EditorPanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canEdit =
    isAdmin ||
    actions.includes('create-timetable') ||
    actions.includes('update-timetable') ||
    actions.includes('create-all-branch-timetable') ||
    actions.includes('update-all-branch-timetable');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-timetable');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [grid, setGrid] = useState({});

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', effectiveBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: effectiveBranchId || undefined,
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

  const { data: timetableRes, isFetching: timetableLoading } = useQuery({
    queryKey: ['section-timetable', sectionId, academicYear],
    queryFn: () =>
      fetchData({ url: `/timetable/section/${sectionId}`, token, academicYear }),
    enabled: !!token && !!sectionId,
    staleTime: 0,
  });
  const periodConfig = timetableRes?.data?.periodConfig;
  const remoteGrid = timetableRes?.data?.grid;

  const { data: subjectData } = useQuery({
    queryKey: ['subjects-for-class-tt', classId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/subject/list',
        page: 1,
        limit: 200,
        token,
        classId,
        academicYear,
        isActive: true,
      }),
    enabled: !!token && !!classId,
    staleTime: 60000,
  });
  const subjects = subjectData?.data || [];

  const { data: staffData } = useQuery({
    queryKey: ['teaching-staff-tt', effectiveBranchId],
    queryFn: () =>
      fetchData({
        url: '/staff/list',
        page: 1,
        limit: 500,
        token,
        staffType: 'teaching',
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token && !!effectiveBranchId,
    staleTime: 60000,
  });
  const teachers = staffData?.data || [];

  // Initialise local grid state from remote
  useEffect(() => {
    if (!remoteGrid || !periodConfig) {
      setGrid({});
      return;
    }
    const next = {};
    periodConfig.workingDays.forEach((d) => {
      next[d] = {};
      periodConfig.periods.forEach((p) => {
        const cell = remoteGrid?.[d]?.[p.number];
        if (cell) {
          next[d][p.number] = {
            slotType: cell.slotType,
            subjectId:
              typeof cell.subject === 'object'
                ? cell.subject?._id
                : cell.subjectId || '',
            staffId:
              typeof cell.staff === 'object'
                ? cell.staff?._id
                : cell.staffId || '',
            customLabel: cell.customLabel || '',
            room: cell.room || '',
            notes: cell.notes || '',
          };
        }
      });
    });
    setGrid(next);
  }, [remoteGrid, periodConfig]);

  const updateCell = (day, periodNumber, patch) => {
    setGrid((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [periodNumber]: { ...(prev[day]?.[periodNumber] || {}), ...patch } },
    }));
  };

  const bulkMutation = useMutation({
    mutationFn: (payload) => postData({ url: '/timetable/bulk', payload, token }),
    onSuccess: (res) => {
      toast.success(`Saved — ${res?.data?.created ?? 0} slots`);
      queryClient.invalidateQueries({ queryKey: ['section-timetable', sectionId] });
    },
    onError: (err) => toast.error(err.message || 'Failed to save timetable'),
  });

  const handleSave = () => {
    if (!sectionId || !periodConfig) return;
    const slots = [];
    let invalid = null;
    periodConfig.workingDays.forEach((d) => {
      periodConfig.periods.forEach((p) => {
        const cell = grid?.[d]?.[p.number];
        if (p.type === 'lesson') {
          if (!cell || !cell.subjectId || !cell.staffId) return;
          slots.push({
            day: d,
            periodNumber: p.number,
            slotType: 'lesson',
            subjectId: cell.subjectId,
            staffId: cell.staffId,
            ...(cell.room ? { room: cell.room } : {}),
            ...(cell.notes ? { notes: cell.notes } : {}),
          });
        } else {
          slots.push({
            day: d,
            periodNumber: p.number,
            slotType: p.type,
            customLabel: p.name,
          });
        }
      });
    });
    if (invalid) {
      toast.error(invalid);
      return;
    }
    if (!slots.length) {
      toast.error('Add at least one slot before saving');
      return;
    }
    bulkMutation.mutate({
      sectionId,
      academicYear,
      mode: 'replace',
      slots,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {isOrgLevel && (
            <Select
              label="Branch"
              value={branchId}
              onChange={setBranchId}
              options={[{ value: '', label: 'Select branch...' }, ...branches.map((b) => ({ value: b._id, label: b.name }))]}
            />
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Academic Year</label>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
            />
          </div>
          <Select
            label="Class"
            value={classId}
            onChange={setClassId}
            disabled={!effectiveBranchId}
            options={[
              { value: '', label: effectiveBranchId ? 'Select class...' : 'Pick branch first' },
              ...classes.map((c) => ({ value: c._id, label: `${c.name}${c.grade ? ` (Gr ${c.grade})` : ''}` })),
            ]}
          />
          <Select
            label="Section"
            value={sectionId}
            onChange={setSectionId}
            disabled={!classId}
            options={[
              { value: '', label: classId ? 'Select section...' : 'Pick class first' },
              ...sections.map((s) => ({ value: s._id, label: s.name })),
            ]}
          />
          <div className="flex items-end">
            <button
              onClick={handleSave}
              disabled={!sectionId || !canEdit || bulkMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {bulkMutation.isPending ? 'Saving…' : 'Save Whole Week'}
            </button>
          </div>
        </div>
      </div>

      {!sectionId ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          Pick a section to load its timetable.
        </div>
      ) : timetableLoading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          Loading timetable…
        </div>
      ) : !periodConfig ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-sm text-amber-800 bg-amber-50 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">No period config</p>
            <p>
              This branch has no default period config yet. Open the{' '}
              <strong>Period Configs</strong> tab and create one before building
              section timetables.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-800">
                  Period
                </th>
                {periodConfig.workingDays.map((d) => (
                  <th
                    key={d}
                    className="px-3 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold min-w-[200px]"
                  >
                    {DAY_LABELS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodConfig.periods.map((p) => (
                <tr key={p.number} className="border-t border-gray-100 dark:border-gray-800 align-top">
                  <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-900">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {p.startTime} – {p.endTime}
                    </div>
                    <span
                      className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                        PERIOD_TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p.type}
                    </span>
                  </td>
                  {periodConfig.workingDays.map((d) => (
                    <td key={d} className="px-2 py-2 border-l border-gray-100 dark:border-gray-800">
                      {p.type === 'lesson' ? (
                        <LessonCell
                          cell={grid?.[d]?.[p.number]}
                          subjects={subjects}
                          teachers={teachers}
                          disabled={!canEdit}
                          onChange={(patch) => updateCell(d, p.number, patch)}
                        />
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400 italic px-2 py-3">
                          {p.name}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!canEdit && sectionId && (
        <p className="text-xs text-gray-500 dark:text-gray-400">You have read-only access to timetables.</p>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LessonCell({ cell, subjects, teachers, disabled, onChange }) {
  const c = cell || {};
  return (
    <div className="space-y-1">
      <select
        value={c.subjectId || ''}
        disabled={disabled}
        onChange={(e) => onChange({ subjectId: e.target.value })}
        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
      >
        <option value="">— Subject —</option>
        {subjects.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name} ({s.code})
          </option>
        ))}
      </select>
      <select
        value={c.staffId || ''}
        disabled={disabled}
        onChange={(e) => onChange({ staffId: e.target.value })}
        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
      >
        <option value="">— Teacher —</option>
        {teachers.map((t) => (
          <option key={t._id} value={t._id}>
            {t.user?.name || t.designation}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={c.room || ''}
        disabled={disabled}
        onChange={(e) => onChange({ room: e.target.value })}
        placeholder="Room"
        className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50 placeholder:text-gray-400"
      />
    </div>
  );
}
