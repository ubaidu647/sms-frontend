import { NextResponse } from 'next/server';
import { SESSION_COOKIE, ROLE_COOKIE } from '@/utils/session';
import { dashboardRedirect, parseRoleCookie } from '@/utils/dashboardRoute';

export function middleware(req) {
  // `sms_at_admin` is the API's httpOnly session cookie for this portal (shared
  // across *.nodecampus.online). Its presence is a routing hint only — the API
  // validates it on every request.
  const token = req.cookies.get(SESSION_COOKIE)?.value || null;
  const { roleName, hasActions } = parseRoleCookie(req.cookies.get(ROLE_COOKIE)?.value || null);

  // The rules (public paths, system-role routes, the /dashboard home page)
  // live in utils/dashboardRoute.js, where they are unit-tested.
  const target = dashboardRedirect({
    hasToken: !!token,
    roleName,
    hasActions,
    pathname: req.nextUrl.pathname,
  });
  return target ? NextResponse.redirect(new URL(target, req.url)) : NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin'],
};
