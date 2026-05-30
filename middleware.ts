import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function verifyToken(token: string, password: string): Promise<boolean> {
  try {
    const dotIdx = token.indexOf('.');
    if (dotIdx === -1) return false;

    const timestampStr = token.slice(0, dotIdx);
    const receivedHex = token.slice(dotIdx + 1);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) return false;

    // Reject tokens older than 8 hours
    if (Date.now() - timestamp > 8 * 60 * 60 * 1000) return false;

    // Recompute HMAC-SHA256(password, "admin:<timestamp>")
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`admin:${timestampStr}`));
    const expectedHex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (expectedHex.length !== receivedHex.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      diff |= expectedHex.charCodeAt(i) ^ receivedHex.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip the login page and login API
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  // Protect /admin/* pages and /api/admin/* endpoints
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminToken = request.cookies.get('admin_token')?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const isValid = adminToken && adminPassword
      ? await verifyToken(adminToken, adminPassword)
      : false;

    if (!isValid) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
