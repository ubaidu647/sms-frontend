import { NextResponse } from 'next/server';
import { SESSION_COOKIE, ROLE_COOKIE } from '@/utils/session';

export function middleware(req) {
  // `sms_at_admin` is the API's httpOnly session cookie for this portal (shared
  // across *.nodecampus.online). Its presence is a routing hint only — the API
  // validates it on every request.
  const token = req.cookies.get(SESSION_COOKIE)?.value || null;
  const roleRaw = req.cookies.get(ROLE_COOKIE)?.value || null;

  let role = null;
  if (roleRaw) {
    try {
      role = JSON.parse(decodeURIComponent(roleRaw));
    } catch {
      role = null;
    }
  }

  const roleName = role?.name || null;
  // The cookie holds a slim role ({ name, isPredefined, hasActions }); a cookie
  // written before that change still carries the full `actions` array.
  const hasActions =
    typeof role?.hasActions === 'boolean'
      ? role.hasActions
      : Array.isArray(role?.actions) && role.actions.length > 0;
  const pathname = req.nextUrl.pathname;

  // Public routes
  const publicPaths = ['/signin', '/forgot-password'];

  // 1️⃣ Redirect logged-in user away from signin/forgot-password
  if (token && publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 2️⃣ Redirect non-logged-in user to signin
  if (!token && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // Personal pages every authenticated user can reach regardless of role.
  if (pathname.startsWith('/dashboard/settings')) {
    return NextResponse.next();
  }

  // Named roles the backend ships with. The super-admin's tenant/billing console
  // is a separate app (@sms/system, port 3002) — here they are treated exactly
  // like an admin, i.e. school-scoped.
  const systemRoles = ['super-admin', 'admin', 'sub-admin'];

  // Staff/Roles and the business setup (branches, branch profile, WhatsApp) live
  // outside /dashboard/school — they are reached from the topbar menu, so those
  // routes have to be allowed too or every system role would bounce to
  // /unauthorized.
  const USER_MANAGEMENT = '/dashboard/user-management';
  const BUSINESS_SETTINGS = '/dashboard/business-settings';
  const BILLING = '/dashboard/billing';

  // --- System roles (super-admin, admin, sub-admin) all land on the school app.
  if (systemRoles.includes(roleName)) {
    const allowedRoutes = ['/dashboard/school', USER_MANAGEMENT, BUSINESS_SETTINGS, BILLING];

    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/school', req.url));
    }
    if (!allowedRoutes.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  }

  // --- Dynamic / unknown roles (not system roles)
  if (!systemRoles.includes(roleName)) {
    if (pathname.startsWith('/dashboard')) {
      if (!hasActions) {
        // No actions → unauthorized
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }

      // Redirect to school dashboard if hitting /dashboard
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/dashboard/school', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin', '/forgot-password'],
};
