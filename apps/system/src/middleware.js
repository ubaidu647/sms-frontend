import { NextResponse } from 'next/server';

// The system console serves exactly one audience: super-admin. Every other role
// belongs in the admin app, so the gate here is a single role check rather than
// the action-by-action RBAC the admin app runs.
//
// NOTE: `auth-role` is written by the client (see useAuth / useSignIn), so this
// check is a routing convenience, not a security boundary — the backend must
// authorize every /package, /subscription and /invoice call on its own.
const PUBLIC_PATHS = ['/signin', '/forgot-password'];

export function middleware(req) {
  const token = req.cookies.get('auth-storage')?.value || null;
  const roleRaw = req.cookies.get('auth-role')?.value || null;
  const { pathname } = req.nextUrl;

  let role = null;
  if (roleRaw) {
    try {
      role = JSON.parse(decodeURIComponent(roleRaw));
    } catch {
      role = null;
    }
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Already signed in and back on the sign-in page → straight to the dashboard.
  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // No session → sign in.
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // Signed in, wrong audience → explain rather than 404.
  if (token && !isPublic && role?.name !== 'super-admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin', '/forgot-password'],
};
