'use client';
import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { ANNOUNCEMENT_SCOPES, SCOPE_LABELS, TARGET_USER_TYPES } from '@/constants/announcement';
import { X } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

const blank = {
  scope: 'school',
  branchIds: [],
  classIds: [],
  sectionIds: [],
  staffIds: [],
  targetUserTypes: ['staff', 'student', 'parent'],
};

export default function AudiencePicker({
  value = blank,
  onChange,
  isOrgLevel = false,
  academicYear,
}) {
  const { accessToken: token } = useTokenStore();

  const safeValue = { ...blank, ...(value || {}) };

  const set = (patch) => onChange({ ...safeValue, ...patch });

  const { data: branchData } = useQuery({
    queryKey: ['branches-audience'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && safeValue.scope === 'branch' && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: classData } = useQuery({
    queryKey: ['classes-audience', academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        academicYear: academicYear || undefined,
      }),
    enabled: !!token && (safeValue.scope === 'class' || safeValue.scope === 'section'),
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const sectionsTargetClassId = safeValue.classIds?.[0] || '';
  const { data: sectionData } = useQuery({
    queryKey: ['sections-audience', sectionsTargetClassId],
    queryFn: () =>
      fetchData({ url: `/class/${sectionsTargetClassId}/sections`, token }),
    enabled: !!token && safeValue.scope === 'section' && !!sectionsTargetClassId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  const { data: staffData } = useQuery({
    queryKey: ['staff-audience'],
    queryFn: () => fetchData({ url: '/staff/list', page: 1, limit: 500, token }),
    enabled: !!token && safeValue.scope === 'staff',
    staleTime: 60000,
  });
  const staff = staffData?.data || [];

  const onScopeChange = (scope) => {
    set({
      scope,
      branchIds: [],
      classIds: [],
      sectionIds: [],
      staffIds: [],
    });
  };

  const toggleUserType = (t) => {
    const has = safeValue.targetUserTypes.includes(t);
    set({
      targetUserTypes: has
        ? safeValue.targetUserTypes.filter((x) => x !== t)
        : [...safeValue.targetUserTypes, t],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>
          Send to<span className="text-red-500">*</span>
        </label>
        <select
          value={safeValue.scope}
          onChange={(e) => onScopeChange(e.target.value)}
          className={inputCls}
        >
          {ANNOUNCEMENT_SCOPES.map((s) => (
            <option key={s} value={s}>
              {SCOPE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {safeValue.scope === 'branch' && (
        <MultiSelect
          label="Branches"
          required
          items={branches.map((b) => ({ value: b._id, label: b.name }))}
          value={safeValue.branchIds}
          onChange={(ids) => set({ branchIds: ids })}
          empty="No branches loaded yet — pick at least one branch."
          disabled={!isOrgLevel}
          disabledHint={
            !isOrgLevel
              ? 'You can only target your own branch — pick School or Class scope.'
              : null
          }
        />
      )}

      {safeValue.scope === 'class' && (
        <MultiSelect
          label="Classes"
          required
          items={classes.map((c) => ({
            value: c._id,
            label: `${c.name}${c.grade ? ` (Gr ${c.grade})` : ''}`,
          }))}
          value={safeValue.classIds}
          onChange={(ids) => set({ classIds: ids })}
        />
      )}

      {safeValue.scope === 'section' && (
        <>
          <div>
            <label className={labelCls}>
              Class<span className="text-red-500">*</span>
            </label>
            <select
              value={sectionsTargetClassId}
              onChange={(e) => set({ classIds: e.target.value ? [e.target.value] : [], sectionIds: [] })}
              className={inputCls}
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.grade ? ` (Gr ${c.grade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <MultiSelect
            label="Sections"
            required
            items={sections.map((s) => ({ value: s._id, label: s.name }))}
            value={safeValue.sectionIds}
            onChange={(ids) => set({ sectionIds: ids })}
            empty={
              !sectionsTargetClassId
                ? 'Pick a class first.'
                : 'No sections in this class.'
            }
          />
        </>
      )}

      {safeValue.scope === 'staff' && (
        <MultiSelect
          label="Staff"
          required
          items={staff.map((s) => ({
            value: s._id,
            label: `${s.user?.name || s.name || 'Staff'}${s.staffType ? ` · ${s.staffType}` : ''}`,
          }))}
          value={safeValue.staffIds}
          onChange={(ids) => set({ staffIds: ids })}
        />
      )}

      <div>
        <label className={labelCls}>
          Notify user types<span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {TARGET_USER_TYPES.map((t) => {
            const checked = safeValue.targetUserTypes.includes(t);
            return (
              <label
                key={t}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer text-sm ${
                  checked
                    ? 'bg-teal-50 border-teal-300 text-teal-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleUserType(t)}
                  className="hidden"
                />
                <span className="capitalize">{t}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  items,
  value = [],
  onChange,
  required,
  empty,
  disabled,
  disabledHint,
}) {
  const selected = useMemo(
    () => value.map((id) => items.find((i) => i.value === id)).filter(Boolean),
    [value, items],
  );
  const available = items.filter((i) => !value.includes(i.value));

  const add = (id) => {
    if (id && !value.includes(id)) onChange([...value, id]);
  };
  const remove = (id) => onChange(value.filter((x) => x !== id));

  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value=""
        onChange={(e) => add(e.target.value)}
        disabled={disabled || items.length === 0}
        className={inputCls}
      >
        <option value="">
          {disabled
            ? disabledHint || 'Disabled'
            : items.length === 0
              ? empty || 'No options'
              : `Add ${label.toLowerCase()}...`}
        </option>
        {available.map((i) => (
          <option key={i.value} value={i.value}>
            {i.label}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s.value}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs text-teal-800"
            >
              {s.label}
              <button
                type="button"
                onClick={() => remove(s.value)}
                className="text-teal-700 hover:text-teal-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
