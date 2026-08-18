'use client';
import React from 'react';
import { Eye, Edit, Trash2, Ban, CheckCircle, Building2, Globe2, KeyRound } from 'lucide-react';
import { AVAILABLE_MENUS } from '@/constants/rolePermissions';

// Stable accent per role — same role always gets the same colour, so the grid
// stays recognisable between visits without storing anything.
const ACCENTS = [
  { ring: 'ring-teal-500/30', bg: 'bg-teal-600', soft: 'bg-teal-50 dark:bg-teal-900/30' },
  { ring: 'ring-indigo-500/30', bg: 'bg-indigo-600', soft: 'bg-indigo-50 dark:bg-indigo-900/30' },
  { ring: 'ring-amber-500/30', bg: 'bg-amber-600', soft: 'bg-amber-50 dark:bg-amber-900/30' },
  { ring: 'ring-rose-500/30', bg: 'bg-rose-600', soft: 'bg-rose-50 dark:bg-rose-900/30' },
  { ring: 'ring-violet-500/30', bg: 'bg-violet-600', soft: 'bg-violet-50 dark:bg-violet-900/30' },
  { ring: 'ring-sky-500/30', bg: 'bg-sky-600', soft: 'bg-sky-50 dark:bg-sky-900/30' },
];

const accentFor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return ACCENTS[h % ACCENTS.length];
};

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

// Menu keys are slugs ("report-student-fee-defaulter"); show the human label and
// drop the "Group — " prefix so chips stay short.
const MENU_LABELS = new Map(AVAILABLE_MENUS.map((m) => [m.key, m.label]));
const menuLabel = (key) => {
  const label = MENU_LABELS.get(key) || key.replace(/-/g, ' ');
  const parts = label.split('—');
  return parts[parts.length - 1].trim();
};

const CHIP_LIMIT = 4;

export default function RoleCard({ role, actions = [], onAction }) {
  const accent = accentFor(role.name);

  const menus = role.menus || [];
  const actionKeys = role.actions || [];
  // A role that can reach other branches is worth calling out — it is the
  // difference between a branch clerk and a head-office one.
  const isOrgWide = actionKeys.some((a) => a.includes('-all-branch-'));

  const shown = menus.slice(0, CHIP_LIMIT);
  const rest = menus.length - shown.length;

  const ICONS = {
    view: Eye,
    edit: Edit,
    toggle: role.isActive ? Ban : CheckCircle,
    delete: Trash2,
  };

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:ring-4 ${accent.ring} ${
        role.isActive ? '' : 'opacity-70'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 shrink-0 rounded-xl ${accent.bg} text-white grid place-items-center font-semibold text-sm`}
        >
          {initials(role.name)}
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onAction('view', role)}
            className="block max-w-full truncate text-left text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-teal-700 dark:hover:text-teal-400"
            title={role.name}
          >
            {role.name}
          </button>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono">{role.serialNumber || '—'}</span>
            <span>·</span>
            {isOrgWide ? (
              <Globe2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Building2 className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">
              {isOrgWide ? 'All branches' : role.branch?.name || 'Branch scoped'}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
            role.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${role.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          {role.isActive ? 'Active' : 'Disabled'}
        </span>
      </div>

      {/* Access at a glance */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className={`rounded-xl px-3 py-2 ${accent.soft}`}>
          <div className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100">
            {menus.length}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Menus
          </div>
        </div>
        <div className={`rounded-xl px-3 py-2 ${accent.soft}`}>
          <div className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100">
            {actionKeys.length}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Permissions
          </div>
        </div>
      </div>

      {/* Menu chips */}
      <div className="mt-3 flex flex-wrap gap-1.5 min-h-[3.5rem] content-start">
        {shown.length === 0 && <span className="text-xs text-gray-400">No menus assigned yet</span>}
        {shown.map((m) => (
          <span
            key={m}
            title={MENU_LABELS.get(m) || m}
            className="inline-flex max-w-full truncate px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          >
            {menuLabel(m)}
          </span>
        ))}
        {rest > 0 && (
          <button
            type="button"
            onClick={() => onAction('view', role)}
            className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
          >
            +{rest} more
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          {role.isPredefined ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <KeyRound className="w-3 h-3" />
              Predefined
            </span>
          ) : (
            <span className="inline-flex px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              Custom
            </span>
          )}
          {role.createdAt && <span>{new Date(role.createdAt).toLocaleDateString()}</span>}
        </div>

        <div className="flex items-center gap-1">
          {actions.map((a) => {
            const Icon = ICONS[a.value] || Eye;
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => onAction(a.value, role)}
                title={a.label}
                aria-label={a.label}
                className={`p-1.5 rounded-lg transition-colors ${
                  a.danger
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
