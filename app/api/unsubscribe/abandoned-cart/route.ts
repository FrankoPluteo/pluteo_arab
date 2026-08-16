import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPayload } from '@/lib/signedToken';

function page(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F7F7;font-family:'Montserrat',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:60px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #E5E5E5;">
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <p style="margin:0 0 20px 0;font-size:13px;font-weight:300;letter-spacing:6px;color:#111111;text-transform:uppercase;">PLUTEO</p>
              <p style="margin:0;font-size:14px;color:#333333;line-height:1.7;">${body}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// GET /api/unsubscribe/abandoned-cart?email=...&sig=...
// Suppresses future abandoned-cart reminder emails for this address. Global — not
// tied to one order — since GDPR opt-out has to hold for every future cart, not
// just the one referenced in the email that was clicked.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const sig = url.searchParams.get('sig');

  if (!email || !sig) {
    return new NextResponse(page('Neispravna poveznica', 'Ova poveznica za odjavu nije valjana.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const normalized = email.trim().toLowerCase();
  if (!verifyPayload(normalized, sig)) {
    return new NextResponse(page('Neispravna poveznica', 'Ova poveznica za odjavu nije valjana.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  await prisma.abandonedCartOptOut.upsert({
    where: { email: normalized },
    update: {},
    create: { email: normalized },
  });

  return new NextResponse(
    page('Odjavljeni ste', 'Više nećeš primati podsjetnike za napuštenu košaricu. Ostale narudžbe i obavijesti o dostavi ovo ne mijenja.'),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
