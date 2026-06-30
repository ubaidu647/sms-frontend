'use client';
import { CalendarDays, Coffee } from 'lucide-react';
import { useTimetable } from '@/hooks/useDashboard';
import { PageHeader } from '@/component/dashboard/Panel';
import { Loading, ErrorState, EmptyState } from '@/component/dashboard/States';

const DAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

export default function TimetablePage() {
  const { data, isLoading, isError, error, refetch } = useTimetable();

  const byDay = data || {};
  const hasAny = DAYS.some(([k]) => (byDay[k] || []).length > 0);

  return (
    <div className="max-w-6xl">
      <PageHeader icon={CalendarDays} title="Timetable" subtitle="Your weekly class schedule" />

      {isLoading ? (
        <Loading label="Loading timetable…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !hasAny ? (
        <EmptyState
          title="No timetable yet"
          description="Your weekly schedule will appear here once published."
          icon={CalendarDays}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map(([key, label]) => {
            const slots = (byDay[key] || [])
              .slice()
              .sort((a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0));
            return (
              <div
                key={key}
                className="rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <div className="px-4 py-3 bg-[#00918e] text-white text-sm font-semibold">
                  {label}
                </div>
                <div className="p-3 space-y-2 min-h-[80px]">
                  {slots.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">
                      No classes
                    </p>
                  ) : (
                    slots.map((slot, i) => <SlotRow key={slot._id || i} slot={slot} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SlotRow({ slot }) {
  // Non-class slots (e.g. break) carry no subjectId — render customLabel.
  const isClass = slot.slotType === 'period' && slot.subjectId;
  const title = isClass ? slot.subjectId?.name : slot.customLabel || 'Break';

  return (
    <div
      className={`rounded-xl px-3 py-2 flex items-center gap-2 ${
        isClass
          ? 'bg-gray-50 dark:bg-gray-800/60'
          : 'bg-[#f5b21c]/10 text-[#b07d00] dark:text-[#f5b21c]'
      }`}
    >
      <span
        className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold ${
          isClass ? 'bg-[#00918e] text-white' : 'bg-transparent'
        }`}
      >
        {isClass ? slot.periodNumber ?? '·' : <Coffee className="w-3.5 h-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{title}</p>
        {isClass && slot.room && (
          <p className="text-xs text-gray-400">Room {slot.room}</p>
        )}
      </div>
    </div>
  );
}
