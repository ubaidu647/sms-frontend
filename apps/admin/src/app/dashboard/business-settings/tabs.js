import { Building2, IdCard, MessageCircle } from 'lucide-react';
import { canSee } from '@/utils/permissions';
import { ACTIONS } from '@/constants/rolePermissions';

// Business Settings holds how the organisation itself is set up — its branches,
// their letterheads, and the WhatsApp channel it sends from. None of that is
// day-to-day school work, so it lives behind the topbar rather than the sidebar.
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
    label: 'WhatsApp',
    href: '/dashboard/business-settings/whatsapp',
    icon: MessageCircle,
    canAccess: (role) => canSee(role, ACTIONS.VIEW_WHATSAPP_SETTINGS),
  },
];

/** True when the user can open at least one Business Settings tab. */
export const canOpenBusinessSettings = (role) =>
  !!role?.isPredefined || BUSINESS_SETTINGS_TABS.some((t) => t.canAccess(role));
