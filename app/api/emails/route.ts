import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });
  }

  const record = await prisma.emailCapture.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  // Fire-and-forget — a Resend failure must never break the user-facing response.
  // Run exactly once per email: skip if welcomeEmailSentAt is already set.
  if (!record.welcomeEmailSentAt) {
    if (process.env.RESEND_AUDIENCE_ID) {
      resend.contacts
        .create({ email, audienceId: process.env.RESEND_AUDIENCE_ID })
        .catch((err) => console.error('Resend audience add error:', err));
    }

    prisma.emailCapture
      .update({
        where: { email },
        data: { welcomeEmailSentAt: new Date() },
      })
      .catch((err) => console.error('EmailCapture update error:', err));
  }

  return NextResponse.json({ success: true });
}
