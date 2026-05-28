import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

const WELCOME_TEXT = `Hej,

evo tvog koda: LJETO15
15% popusta na sve parfeme. Unesi ga na checkoutu i automatski se odbija.

Ovog ljeta predlažemo:

Yara — nježna, cvjetna, postojana. Savršena za tople dane.
The Kingdom For Women — elegantna i bogata. Miris koji ostaje.
Club de Nuit Woman — zlatna klasika s karakterom.

Otkrij sve na pluteo.shop → 

Besplatna dostava iznad 40€.

Pluteo 🖤`;

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
  // Send exactly once: skip if welcomeEmailSentAt is already set.
  if (!record.welcomeEmailSentAt) {
    resend.emails.send({
      from: 'Pluteo <hello@pluteo.shop>',
      to: email,
      subject: 'Tvoj kod je tu 🖤',
      text: WELCOME_TEXT,
    })
    .then(() =>
      prisma.emailCapture.update({
        where: { email },
        data: { welcomeEmailSentAt: new Date() },
      })
    )
    .catch((err) => console.error('Resend welcome email error:', err));
  }

  return NextResponse.json({ success: true });
}
