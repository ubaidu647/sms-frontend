'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarRange, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { getSchoolSettings, updateSchoolSettings } from '@/services/schoolSettings';
import {
  MONTH_NAMES,
  currentAcademicYear,
  defaultAcademicYearStartMonth,
  monthName,
  setSchoolAcademicYearStartMonth,
  startMonthFromSettings,
} from '@/utils/academicYear';

const SETTINGS_KEY = ['school', 'settings'];

// The month a school's academic session starts in. Everything that works out
// "the current academic year" — timetable live views, leave years, promotion,
// and the default year in forms and filters — follows it.
export default function AcademicYearSettingsPage() {
  const { user } = useUserStore();
  const isAdmin = !!user?.role?.isPredefined;
  const qc = useQueryClient();

  const query = useQuery({ queryKey: SETTINGS_KEY, queryFn: getSchoolSettings });
  const settings = query.data?.data;
  const fallback = settings?.defaultAcademicYearStartMonth ?? defaultAcademicYearStartMonth();

  // '' = follow the default; otherwise "1".."12"
  const [value, setValue] = useState('');
  useEffect(() => {
    if (settings)
      setValue(settings.academicYearStartMonth ? String(settings.academicYearStartMonth) : '');
  }, [settings]);

  const saved = settings?.academicYearStartMonth ? String(settings.academicYearStartMonth) : '';
  const dirty = !!settings && value !== saved;
  const chosen = value ? Number(value) : fallback;
  // The month in force right now, as the API reports it.
  const effective = startMonthFromSettings(settings) ?? fallback;
  const usesDefault = !settings?.academicYearStartMonth;

  const preview = useMemo(
    () => ({
      before: currentAcademicYear(new Date(), effective),
      after: currentAcademicYear(new Date(), chosen),
    }),
    [effective, chosen],
  );

  const save = useMutation({
    mutationFn: () =>
      updateSchoolSettings({ academicYearStartMonth: value ? Number(value) : null }),
    onSuccess: (res) => {
      // Apply the month the API now uses (its effective month), not the
      // nullable own setting — "default" means the server's default.
      setSchoolAcademicYearStartMonth(startMonthFromSettings(res?.data));
      qc.setQueryData(SETTINGS_KEY, res);
      // cached lists were fetched for the old "current year"
      qc.invalidateQueries();
      toast.success(res?.message || 'Academic year settings saved');
    },
    onError: (err) => toast.error(err.message || 'Failed to save settings'),
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-3xl mx-auto w-full pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30">
            <CalendarRange className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Academic Year
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The month your school’s academic session starts in.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-5">
          {query.isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : query.isError ? (
            <p className="text-sm text-red-600">
              {query.error?.message || 'Could not load settings'}
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="academic-year-start-month"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Session starts in
                </label>
                <select
                  id="academic-year-start-month"
                  value={value}
                  disabled={!isAdmin || save.isPending}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full sm:w-72 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-60"
                >
                  <option value="">Default ({monthName(fallback)})</option>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={String(i + 1)}>
                      {name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Currently{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {monthName(effective)}
                  </span>{' '}
                  {usesDefault ? '(the default — no school setting)' : '(set by your school)'}.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  With this setting, today falls in academic year{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {preview.after}
                  </span>
                  .
                </p>
              </div>

              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Change this only between sessions.</p>
                  <p>
                    It decides which academic year counts as “current” everywhere: timetable live
                    and teacher views, free-teacher and conflict reports, leave years and balances,
                    promotion, and the default year in forms and filters. Changing it mid-session
                    can move today into a different academic year — existing classes, sections and
                    records keep the year they were created with.
                  </p>
                  {dirty && preview.before !== preview.after && (
                    <p className="font-medium">
                      Saving moves the current academic year from {preview.before} to{' '}
                      {preview.after}.
                    </p>
                  )}
                </div>
              </div>

              {isAdmin ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!dirty || save.isPending}
                    onClick={() => save.mutate()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {save.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Only the school admin can change this setting.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
