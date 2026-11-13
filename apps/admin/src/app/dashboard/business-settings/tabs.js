import { Banknote, Blocks, Building2, CalendarRange, IdCard, MessageCircle } from 'lucide-react';
import { canSee } from '@/utils/permissions';
import { ACTIONS } from '@/constants/rolePermissions';

// Business Settings holds how the organisation itself is set up — its branches,
// their letterheads, its academic calendar, and the WhatsApp channel it sends from. None of that is
// day-to-day school work, so it lives behind the topbar rather than the sidebar.
// `feature` names the plan add-on module a tab belongs to (utils/planFeatures.js);
// the layout locks or hides such a tab when the school's plan lacks it.
// `labelKey` (planFeatures namespace) is used instead of `label` when set.
export const BUSINESS_SETTINGS_TABS = [
  {
    label: 'Branches',
    href: '/dashboard/business-settings/branches',
    icon: Building2,
    canAccess: (role) => canSee(role, ACTIONS.VIEW_BRANCH),
    // Branch profile routes nest under /branches, so exclude them here or both
    // tabs would light up at once.
    isActive: (path) =>
      path.startsWith('/dashboard/business-settings/branches') &&
      !path.startsWith('/dashboard/business-settings/branches/profile'),
  },
  {
    label: 'Branch Profile',
    href: '/dashboard/business-settings/branches/profile',
    icon: IdCard,
    canAccess: (role) => canSee(role, ACTIONS.VIEW_BRANCH_PROFILE),
    // /branches/profile (own) and /branches/profiles (org list) both belong here.
    isActive: (path) => path.startsWith('/dashboard/business-settings/branches/profile'),
  },
  {
    label: 'Academic Year',
    href: '/dashboard/business-settings/academic-year',
    icon: CalendarRange,
    // School-wide setting: only the school's admin (predefined role) changes it,
    // matching the backend's PATCH /schools/settings rule.
    canAccess: (role) => !!role?.isPredefined,
  },
  {
    // What the plan includes, and whether menus lock or hide the rest. Same
    // rule as Academic Year: PATCH /schools/settings is the school admin's.
    label: 'Plan Modules',
    labelKey: 'tabLabel',
    href: '/dashboard/business-settings/plan-modules',
    icon: Blocks,
    canAccess: (role) => !!role?.isPredefined,
  },
  {
    // The currency the school's own money is shown in (a label only). Same
    // rule as Academic Year: PATCH /schools/settings is the school admin's.
    label: 'Currency',
    labelKey: 'currencyTabLabel',
    href: '/dashboard/business-settings/currency',
    icon: Banknote,
    canAccess: (role) => !!role?.isPredefined,
  },
  {
    label: 'WhatsApp',
    href: '/dashboard/business-settings/whatsapp',
    icon: MessageCircle,
    feature: 'whatsapp',
    canAccess: (role) => canSee(role, ACTIONS.VIEW_WHATSAPP_SETTINGS),
  },
];

/**
 * True when the user can open at least one Business Settings tab. `gate`
 * (usePlanFeatures().gate) leaves out tabs the plan hides; omitted, only the
 * role counts.
 */
export const canOpenBusinessSettings = (role, gate) =>
  !!role?.isPredefined ||
  BUSINESS_SETTINGS_TABS.some((t) => t.canAccess(role) && (!gate || gate(t.feature) !== 'hide'));
