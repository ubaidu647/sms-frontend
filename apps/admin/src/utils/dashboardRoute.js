// Pure routing decision behind middleware.js, kept free of Next.js imports so
// it can be unit-tested with node --test.

// Public routes. There is no self-service "forgot password": a staff member's
// password is reset by the school admin, and the school admin's by the
// platform (system console).
export const PUBLIC_PATHS = ['/signin'];

// Named roles the backend ships with. The super-admin's tenant/billing console
// is a separate app (@sms/system, port 3002) — here they are treated exactly
// like an admin, i.e. school-scoped.
export const SYSTEM_ROLES = ['super-admin', 'admin', 'sub-admin'];

// The public landing page at the site root. Signed-in users skip it and go
// straight to their dashboard; everyone else sees it.
export const LANDING = '/';

// The home page (Getting started checklist). Matched exactly — it is not a
// prefix for the rest of /dashboard.
export const HOME = '/dashboard';

// Staff/Roles and the business setup (branches, branch profile, WhatsApp) live
// outside /dashboard/school — they are reached from the topbar menu, so those
// routes have to be allowed too or every system role would bounce to
// /unauthorized.
const SYSTEM_ROLE_ROUTES = [
  '/dashboard/school',
  '/dashboard/user-management',
  '/dashboard/business-settings',
  '/dashboard/billing',
];

/**
 * Parses the role cookie ({ name, isPredefined, hasActions }; a cookie written
 * before that change still carries the full `actions` array).
 */
export function parseRoleCookie(raw) {
  let role = null;
  if (raw) {
    try {
      role = JSON.parse(decodeURIComponent(raw));
    } catch {
      role = null;
    }
  }
  const hasActions =
    typeof role?.hasActions === 'boolean'
      ? role.hasActions
      : Array.isArray(role?.actions) && role.actions.length > 0;
  return { roleName: role?.name || null, hasActions };
}

/**
 * Where a request should go. Returns a path to redirect to, or null to let it
 * through.
 *
 * @param {{ hasToken: boolean, roleName: string | null, hasActions: boolean, pathname: string }} req
 * @returns {string | null}
 */
export function dashboardRedirect({ hasToken, roleName, hasActions, pathname }) {
  if (pathname === LANDING) return hasToken ? HOME : null;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Logged-in user away from signin; logged-out user to signin.
  if (hasToken && isPublic) return HOME;
  if (!hasToken && !isPublic) return '/signin';

  // Personal pages every authenticated user can reach regardless of role.
  if (pathname.startsWith('/dashboard/settings')) return null;

  // System roles (super-admin, admin, sub-admin): the home page plus the
  // school app and the topbar-menu areas.
  if (SYSTEM_ROLES.includes(roleName)) {
    if (pathname === HOME) return null;
    if (!SYSTEM_ROLE_ROUTES.some((r) => pathname.startsWith(r))) return '/unauthorized';
    return null;
  }

  // Dynamic / unknown roles: anything under /dashboard as long as the role
  // grants at least one action (the API enforces each one).
  if (pathname.startsWith('/dashboard') && !hasActions) return '/unauthorized';

  return null;
}
