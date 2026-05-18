import { NextResponse } from 'next/server';

export function middleware(req) {
  const token = req.cookies.get('auth-storage')?.value || null;
  const roleRaw = req.cookies.get('auth-role')?.value || null;

  let role = null;
  if (roleRaw) {
    try {
      role = JSON.parse(decodeURIComponent(roleRaw));
    } catch {
      role = null;
    }
  }

  const roleName = role?.name || null;
  const actions = role?.actions || [];
  const pathname = req.nextUrl.pathname;

  console.log('roleName', roleName);
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

  const systemRoles = ['super-admin', 'admin', 'sub-admin'];

  // --- System roles
  if (systemRoles.includes(roleName)) {
    if (roleName === 'super-admin') {
      // Super-admin goes to system dashboard by default
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/dashboard/system', req.url));
      }

      const allowedRoutes = ['/dashboard/system', '/dashboard/school'];
      if (!allowedRoutes.some((r) => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    } else {
      // admin or sub-admin → school dashboard
      const allowedRoutes = ['/dashboard/school'];
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/dashboard/school', req.url));
      }
      if (!allowedRoutes.some((r) => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  }

  // --- Dynamic / unknown roles (not system roles)
  if (!systemRoles.includes(roleName)) {
    if (pathname.startsWith('/dashboard')) {
      if (actions.length === 0) {
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
