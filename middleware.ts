import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip the login page and login API
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  // Protect /admin/* pages and /api/admin/* endpoints
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!adminToken) {
      // For API routes, return 401
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Unauthorized. Please log in.' },
          { status: 401 }
        );
      }

      // For pages, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate the token format (base64 of password:timestamp)
    try {
      const decoded = Buffer.from(adminToken, 'base64').toString();
      const [password, timestampStr] = decoded.split(':');
      const timestamp = parseInt(timestampStr, 10);

      // Check token is not older than 8 hours
      const eightHoursMs = 8 * 60 * 60 * 1000;
      if (Date.now() - timestamp > eightHoursMs) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json(
            { error: 'Session expired. Please log in again.' },
            { status: 401 }
          );
        }
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Verify password matches
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword || password !== adminPassword) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json(
            { error: 'Unauthorized.' },
            { status: 401 }
          );
        }
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Invalid session.' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
