import { Users, ShieldCheck } from 'lucide-react';
import { canSee } from '@/utils/permissions';

// Staff and Roles live here rather than in the sidebar: both are administration
// of *who can use the system*, not day-to-day school work. Reached from the
// topbar's User Management entry.
//
// A tab shows for any scope of its view action — including view-own-staff, so a
// teacher who may only open their own record still lands somewhere useful.
export const USER_MANAGEMENT_TABS = [
  {
    label: 'Staff',
    href: '/dashboard/user-management/staff',
    icon: Users,
    canAccess: (role) => canSee(role, 'view-staff'),
  },
  {
    label: 'Roles',
    href: '/dashboard/user-management/roles',
    icon: ShieldCheck,
    canAccess: (role) => canSee(role, 'view-role'),
  },
];

/** True when the user can open at least one User Management tab. */
export const canOpenUserManagement = (role) =>
  !!role?.isPredefined || USER_MANAGEMENT_TABS.some((t) => t.canAccess(role));
