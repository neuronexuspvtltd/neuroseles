import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'crm_session';
const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'neurosales-crm-super-secret-jwt-key-2026'
);

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets & Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;
  let userRole = '';

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
      if (payload && payload.userId) {
        isAuthenticated = true;
        userRole = (payload.role as string) || '';
      }
    } catch (err) {
      isAuthenticated = false;
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicApiRoute = PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Unauthenticated user accessing protected route
  if (!isAuthenticated && !isPublicRoute && !isPublicApiRoute) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Please log in to continue.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user accessing login page -> redirect to dashboard
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. User Management page restriction (Admin only)
  if (isAuthenticated && pathname.startsWith('/users') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
