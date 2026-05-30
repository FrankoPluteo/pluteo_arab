import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function signToken(password: string, timestamp: number): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`admin:${timestamp}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${timestamp}.${hex}`;
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 500 });
    }

    if (password !== adminPassword) {
      // Constant-time-ish delay to slow brute-force attempts
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    const token = await signToken(adminPassword, Date.now());
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
