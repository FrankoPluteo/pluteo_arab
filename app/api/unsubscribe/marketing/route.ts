import { NextResponse } from 'next/server';
import { verifyPayload } from '@/lib/signedToken';
import { normalizeEmail, unsubscribeContact } from '@/lib/resendContacts';

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

const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' };

// The signature covers "marketing:<email>", so a link signed for the abandoned cart
// unsubscribe (which signs the bare email) can't be replayed here or the other way round.
async function unsubscribe(email: string | null, sig: string | null): Promise<'ok' | 'invalid' | 'error'> {
  if (!email || !sig) return 'invalid';
  const normalized = normalizeEmail(email);
  if (!verifyPayload(`marketing:${normalized}`, sig)) return 'invalid';

  try {
    await unsubscribeContact(normalized);
    return 'ok';
  } catch (error) {
    console.error('Marketing unsubscribe failed:', error);
    return 'error';
  }
}

// GET /api/unsubscribe/marketing?email=...&sig=...   (the link in the email footer)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await unsubscribe(url.searchParams.get('email'), url.searchParams.get('sig'));

  if (result === 'invalid') {
    return new NextResponse(page('Neispravna poveznica', 'Ova poveznica za odjavu nije valjana.'), { status: 400, headers: htmlHeaders });
  }
  if (result === 'error') {
    return new NextResponse(page('Pokušaj ponovno', 'Odjava trenutno nije uspjela. Molimo pokušaj ponovno za nekoliko minuta.'), { status: 500, headers: htmlHeaders });
  }
  return new NextResponse(
    page('Odjavljen si', 'Više nećeš primati ponude i novosti na mail. Potvrde narudžbi i obavijesti o dostavi ovo ne mijenja.'),
    { headers: htmlHeaders }
  );
}

// POST is the RFC 8058 one click unsubscribe that mail clients call for the
// List-Unsubscribe header (Gmail's "Unsubscribe" button).
export async function POST(request: Request) {
  const url = new URL(request.url);
  const result = await unsubscribe(url.searchParams.get('email'), url.searchParams.get('sig'));
  if (result === 'invalid') return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  if (result === 'error') return NextResponse.json({ error: 'Try again' }, { status: 500 });
  return NextResponse.json({ unsubscribed: true });
}
