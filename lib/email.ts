import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(orderData: {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  items: any[];
  testerItem?: any | null;
  total: number;
  subtotal?: number;
  shippingCost?: number;
  deliveryMethod?: string;
  boxnowLockerAddress?: string | null;
  boxnowLockerName?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingZip?: string | null;
  promoCode?: string | null;
  promoDiscount?: number;
  paidAt?: Date | null;
  language?: 'en' | 'hr';
}) {
  const isHr = orderData.language === 'hr';

  const orderDate = orderData.paidAt
    ? new Date(orderData.paidAt).toLocaleDateString('hr-HR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('hr-HR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  const shipping = orderData.shippingCost ?? 0;
  const promoDiscount = orderData.promoDiscount ?? 0;
  const subtotal =
    orderData.subtotal ?? orderData.total - shipping + promoDiscount;

  let deliveryAddress = '';
  if (orderData.deliveryMethod === 'boxnow' && orderData.boxnowLockerAddress) {
    deliveryAddress = `BOX NOW: ${orderData.boxnowLockerAddress}`;
  } else if (orderData.shippingAddress) {
    const parts = [
      orderData.shippingAddress,
      orderData.shippingCity,
      orderData.shippingZip,
    ].filter(Boolean);
    deliveryAddress = parts.join(', ');
  }

  const txt = {
    subject: isHr
      ? `Potvrda narudžbe #${orderData.orderNumber}`
      : `Order Confirmation #${orderData.orderNumber}`,
    headerTitle: isHr ? 'Hvala na vašoj narudžbi' : 'Thank You for Your Order',
    headerSub: isHr
      ? `Narudžba potvrđena &nbsp;·&nbsp; #${orderData.orderNumber}`
      : `Order confirmed &nbsp;·&nbsp; #${orderData.orderNumber}`,
    greeting: isHr ? `Pozdrav ${orderData.customerName},` : `Hi ${orderData.customerName},`,
    intro: isHr
      ? 'Vaša narudžba je potvrđena i mi je pripremamo. Dobit ćete obavijest o dostavi čim vaš paket bude na putu.'
      : "Your order has been confirmed and we're getting it ready. You'll receive a shipping update as soon as your package is on its way.",
    orderSummary: isHr ? 'Sažetak narudžbe' : 'Order Summary',
    colProduct: isHr ? 'Proizvod' : 'Product',
    colQty: isHr ? 'Kol.' : 'Qty',
    colPrice: isHr ? 'Cijena' : 'Price',
    freeTester: isHr ? 'BESPLATNI TESTER' : 'FREE TESTER',
    free: isHr ? 'BESPLATNO' : 'FREE',
    subtotalLabel: isHr ? 'Međuzbroj' : 'Subtotal',
    promoLabel: isHr ? 'Promo' : 'Promo',
    shippingLabel: isHr ? 'Dostava' : 'Shipping',
    shippingMethodLabel: orderData.deliveryMethod === 'boxnow' ? 'BOX NOW Locker' : 'GLS Standard',
    shippingFree: isHr ? 'Besplatno' : 'Free',
    totalLabel: isHr ? 'Ukupno' : 'Total',
    buyer: isHr ? 'Kupac' : 'Buyer',
    delivery: isHr ? 'Dostava' : 'Delivery',
    orderDateLabel: isHr ? 'Datum narudžbe' : 'Order date',
    contactLabel: isHr ? 'Kontakt' : 'Contact',
    thankYouTitle: isHr ? 'Hvala što ste odabrali Pluteo' : 'Thank you for choosing Pluteo',
    thankYouBody: isHr
      ? 'Cijenimo vaše povjerenje i jedva čekamo podijeliti naše mirise s vama. Ako imate pitanja, slobodno nas kontaktirajte na'
      : 'We appreciate your trust and look forward to sharing our fragrances with you. If you have any questions, feel free to reach out at',
    cta: isHr ? 'Nastavi kupovinu' : 'Continue Shopping',
  };

  const customerHtml = `
<!DOCTYPE html>
<html lang="${isHr ? 'hr' : 'en'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${txt.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0ee;font-family:'Montserrat',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f0ee;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Brand Bar -->
          <tr>
            <td style="background-color:#ffffff;padding:20px 32px;border-bottom:1px solid #f0e8e6;text-align:center;">
              <span style="font-size:22px;font-weight:700;letter-spacing:5px;color:#3d2c2c;">PLUTEO</span>
            </td>
          </tr>

          <!-- Gradient Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c534e 0%,#A67F8E 100%);padding:40px 32px;text-align:center;">
              <h1 style="margin:0 0 10px 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">${txt.headerTitle}</h1>
              <p style="margin:0;color:rgba(255,255,255,0.82);font-size:13px;letter-spacing:0.5px;">${txt.headerSub}</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 32px 28px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px 0;font-size:16px;color:#3d2c2c;font-weight:600;">${txt.greeting}</p>
              <p style="margin:0 0 32px 0;font-size:13px;color:#777777;line-height:1.7;">${txt.intro}</p>

              <!-- Order Items -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:6px;">
                <tr>
                  <td colspan="3" style="padding-bottom:10px;border-bottom:2px solid #6c534e;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:#6c534e;text-transform:uppercase;">${txt.orderSummary}</span>
                  </td>
                </tr>
                <tr style="background-color:#faf7f6;">
                  <td style="padding:9px 8px 9px 0;font-size:10px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:1px;">${txt.colProduct}</td>
                  <td style="padding:9px 8px;font-size:10px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:1px;text-align:center;">${txt.colQty}</td>
                  <td style="padding:9px 0 9px 8px;font-size:10px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:1px;text-align:right;">${txt.colPrice}</td>
                </tr>
                ${orderData.items
                  .map((item) => {
                    const lineTotal = (
                      (item.product.price - item.product.discountAmount) *
                      item.quantity
                    ).toFixed(2);
                    return `
                <tr>
                  <td style="padding:14px 8px 14px 0;border-bottom:1px solid #f0e8e6;vertical-align:top;">
                    <div style="font-size:13px;font-weight:600;color:#3d2c2c;">${item.product.brand.name} – ${item.product.name}</div>
                    <div style="font-size:11px;color:#aaa;margin-top:3px;">${item.product.concentration} &nbsp;·&nbsp; ${item.product.size} ml</div>
                  </td>
                  <td style="padding:14px 8px;border-bottom:1px solid #f0e8e6;text-align:center;vertical-align:top;font-size:13px;color:#666;">&times;${item.quantity}</td>
                  <td style="padding:14px 0 14px 8px;border-bottom:1px solid #f0e8e6;text-align:right;vertical-align:top;font-size:13px;font-weight:600;color:#3d2c2c;">&euro;${lineTotal}</td>
                </tr>`;
                  })
                  .join('')}
                ${orderData.testerItem ? `
                <tr>
                  <td style="padding:10px 8px 10px 0;border-bottom:1px solid #f0e8e6;vertical-align:top;">
                    <div style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:1.5px;color:#A67F8E;text-transform:uppercase;background:#fdf4f7;border:1px solid #e8d5dd;border-radius:3px;padding:2px 6px;margin-bottom:4px;">${txt.freeTester}</div>
                    <div style="font-size:12px;color:#666;">${orderData.testerItem.product.brand.name} – ${orderData.testerItem.product.name}</div>
                    <div style="font-size:10px;color:#bbb;margin-top:2px;">${orderData.testerItem.product.concentration} &nbsp;·&nbsp; ${orderData.testerItem.product.size} ml</div>
                  </td>
                  <td style="padding:10px 8px;border-bottom:1px solid #f0e8e6;text-align:center;vertical-align:top;font-size:12px;color:#bbb;">&times;1</td>
                  <td style="padding:10px 0 10px 8px;border-bottom:1px solid #f0e8e6;text-align:right;vertical-align:top;font-size:12px;font-weight:600;color:#7a9e7a;">${txt.free}</td>
                </tr>` : ''}
              </table>

              <!-- Pricing Breakdown -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:10px 0 4px 0;font-size:13px;color:#777;">${txt.subtotalLabel}</td>
                  <td style="padding:10px 0 4px 0;font-size:13px;color:#777;text-align:right;">&euro;${subtotal.toFixed(2)}</td>
                </tr>
                ${
                  promoDiscount > 0
                    ? `<tr>
                  <td style="padding:6px 0;font-size:13px;color:#7a9e7a;">${txt.promoLabel}${orderData.promoCode ? ' (' + orderData.promoCode + ')' : ''}</td>
                  <td style="padding:6px 0;font-size:13px;color:#7a9e7a;text-align:right;">&minus;&euro;${promoDiscount.toFixed(2)}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#777;">${txt.shippingLabel} &nbsp;<span style="font-size:11px;color:#bbb;">(${txt.shippingMethodLabel})</span></td>
                  <td style="padding:6px 0;font-size:13px;color:#777;text-align:right;">${shipping === 0 ? `<span style="color:#7a9e7a;">${txt.shippingFree}</span>` : '&euro;' + shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:4px 0;">
                    <div style="border-top:1px solid #ede5e3;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0 0 0;font-size:15px;font-weight:700;color:#3d2c2c;">${txt.totalLabel}</td>
                  <td style="padding:10px 0 0 0;font-size:17px;font-weight:700;color:#6c534e;text-align:right;">&euro;${orderData.total.toFixed(2)}</td>
                </tr>
              </table>

              <!-- Buyer + Delivery -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td width="50%" style="vertical-align:top;padding-right:16px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6c534e;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0e8e6;">${txt.buyer}</div>
                    <div style="font-size:13px;color:#3d2c2c;font-weight:600;margin-bottom:4px;">${orderData.customerName}</div>
                    <div style="font-size:12px;color:#777;margin-bottom:3px;">${orderData.customerEmail}</div>
                    ${orderData.customerPhone ? `<div style="font-size:12px;color:#777;">${orderData.customerPhone}</div>` : ''}
                  </td>
                  <td width="50%" style="vertical-align:top;padding-left:16px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6c534e;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0e8e6;">${txt.delivery}</div>
                    <div style="font-size:12px;color:#666;line-height:1.7;">${deliveryAddress || '&mdash;'}</div>
                  </td>
                </tr>
              </table>

              <!-- Date + Contact row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf7f6;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:1px;">${txt.orderDateLabel}</td>
                        <td style="font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:1px;text-align:right;">${txt.contactLabel}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#3d2c2c;font-weight:600;padding-top:5px;">${orderDate}</td>
                        <td style="font-size:13px;font-weight:600;padding-top:5px;text-align:right;"><a href="mailto:pluteoinfo@gmail.com" style="color:#6c534e;text-decoration:none;">pluteoinfo@gmail.com</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Thank You Message -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-left:3px solid #A67F8E;padding:14px 20px;background-color:#fdf9f8;">
                    <p style="margin:0 0 5px 0;font-size:14px;font-weight:600;color:#3d2c2c;">${txt.thankYouTitle}</p>
                    <p style="margin:0;font-size:13px;color:#888;line-height:1.7;">${txt.thankYouBody} <a href="mailto:pluteoinfo@gmail.com" style="color:#6c534e;text-decoration:none;">pluteoinfo@gmail.com</a>.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://pluteo.shop/products" style="display:inline-block;padding:13px 34px;background-color:#6c534e;color:#ffffff;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${txt.cta}</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f5f4;padding:22px 32px;border-top:1px solid #ede5e3;text-align:center;">
              <img
                src="https://pluteo.shop/Pluteo%20Logo%20Icon.svg"
                alt="Pluteo"
                width="30"
                height="17"
                style="display:block;margin:0 auto 12px auto;opacity:0.35;"
              />
              <p style="margin:0 0 4px 0;font-size:10px;color:#c0afab;letter-spacing:0.5px;">Vonta Grupa d.o.o &nbsp;&middot;&nbsp; Dre&#382;nik 6, 10257 Zagreb &nbsp;&middot;&nbsp; OIB: 87510848203</p>
              <p style="margin:0 0 12px 0;font-size:10px;color:#c0afab;letter-spacing:0.5px;">IBAN: HR5524020061101312303</p>
              <p style="margin:0;font-size:10px;color:#cbbfbc;">&copy; 2026 Pluteo &nbsp;&middot;&nbsp; <a href="https://pluteo.shop" style="color:#cbbfbc;text-decoration:none;">pluteo.shop</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  const shippingMethodLabel =
    orderData.deliveryMethod === 'boxnow' ? 'BOX NOW Locker' : 'GLS Standard';

  const internalLines: string[] = [
    `NARUDŽBA: #${orderData.orderNumber}`,
    `Datum: ${orderDate}`,
    '',
    '--- KUPAC ---',
    `Ime:     ${orderData.customerName}`,
    `Email:   ${orderData.customerEmail}`,
    `Telefon: ${orderData.customerPhone || '—'}`,
    '',
    '--- ARTIKLI ---',
    ...orderData.items.map((item, i) => {
      const unitPrice = (item.product.price - item.product.discountAmount).toFixed(2);
      return `${i + 1}. ${item.product.brand.name} – ${item.product.name} | ${item.product.concentration} | ${item.product.size} ml | x${item.quantity} | €${unitPrice} kom`;
    }),
  ];

  if (orderData.testerItem) {
    internalLines.push(
      `[BESPLATNI TESTER] ${orderData.testerItem.product.brand.name} – ${orderData.testerItem.product.name} | ${orderData.testerItem.product.concentration} | ${orderData.testerItem.product.size} ml`
    );
  }

  internalLines.push(
    '',
    '--- CIJENE ---',
    `Međuzbroj:  €${subtotal.toFixed(2)}`,
  );

  if (promoDiscount > 0) {
    internalLines.push(
      `Promo${orderData.promoCode ? ' (' + orderData.promoCode + ')' : ''}: -€${promoDiscount.toFixed(2)}`
    );
  }

  internalLines.push(
    `Dostava:    ${shipping === 0 ? 'Besplatno' : '€' + shipping.toFixed(2)}`,
    `UKUPNO:     €${orderData.total.toFixed(2)}`,
    '',
    '--- DOSTAVA ---',
    `Metoda:  ${shippingMethodLabel}`,
    `Adresa:  ${deliveryAddress || '—'}`,
  );

  const internalText = internalLines.join('\n');

  try {
    const { data, error } = await resend.emails.send({
      from: 'Pluteo <orders@pluteo.shop>',
      replyTo: 'pluteoinfo@gmail.com',
      to: [orderData.customerEmail],
      subject: txt.subject,
      html: customerHtml,
    });

    if (error) {
      console.error('Customer email error:', error);
      return { success: false, error };
    }

    console.log('Customer email sent successfully:', data);

    try {
      await resend.emails.send({
        from: 'Pluteo <orders@pluteo.shop>',
        to: ['pluteoinfo@gmail.com'],
        subject: `[NOVA NARUDŽBA] #${orderData.orderNumber} - €${orderData.total.toFixed(2)}`,
        text: internalText,
      });
    } catch (internalErr) {
      console.error('Internal notification email failed (non-fatal):', internalErr);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export async function sendFirst50Newsletter(to: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Pluteo <orders@pluteo.shop>',
      to: [to],
      subject: 'You were one of the first 50 — here\'s your gift from Pluteo',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A Gift From Pluteo</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0ee;font-family:'Montserrat',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f0ee;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Brand Bar -->
          <tr>
            <td style="background-color:#ffffff;padding:20px 32px;border-bottom:1px solid #f0e8e6;text-align:center;">
              <span style="font-size:22px;font-weight:700;letter-spacing:5px;color:#3d2c2c;">PLUTEO</span>
            </td>
          </tr>

          <!-- Gradient Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c534e 0%,#A67F8E 100%);padding:48px 32px;text-align:center;">
              <h1 style="margin:0 0 12px 0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">You were one of the first 50.</h1>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:0.5px;line-height:1.7;">And that means everything to us.</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:40px 32px 32px 32px;">

              <p style="margin:0 0 20px 0;font-size:15px;color:#3d2c2c;font-weight:600;line-height:1.6;">Dear friend,</p>

              <p style="margin:0 0 18px 0;font-size:13px;color:#666;line-height:1.9;">
                Every great story has a beginning. Ours starts here — with you.
              </p>
              <p style="margin:0 0 18px 0;font-size:13px;color:#666;line-height:1.9;">
                You joined Pluteo before the world knew our name. You were curious enough to leave your email, to believe in something still taking shape. That kind of trust is rare, and we don't take it lightly.
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-top:1px solid #ede5e3;"></td>
                </tr>
              </table>

              <!-- Promo Code Block -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdf9f8 0%,#f5eeec 100%);border:1px solid #ede5e3;margin-bottom:32px;">
                <tr>
                  <td style="padding:28px 32px;text-align:center;">
                    <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:3px;color:#A67F8E;text-transform:uppercase;">Your exclusive gift</p>
                    <p style="margin:0 0 18px 0;font-size:13px;color:#777;line-height:1.7;">As a thank you for being among our very first 50, we're giving you <strong style="color:#3d2c2c;">20% off</strong> on a selection of our finest perfumes.</p>
                    <div style="display:inline-block;background-color:#3d2c2c;padding:14px 36px;margin-bottom:16px;">
                      <span style="font-size:22px;font-weight:700;letter-spacing:6px;color:#ffffff;">FIRST50</span>
                    </div>
                    <p style="margin:0;font-size:11px;color:#aaa;line-height:1.7;">
                      <strong style="color:#3d2c2c;">Valid on: Effects of Uniq &middot; Odyssey Homme &middot; Atlantis &middot; Enigma Quatre &middot; Enigma Une &middot; Francique 107.9 &middot; Paradigm</strong>
                    </p>

                    <p style="margin:8px 0 0 0;font-size:11px;color:#bbb;">At least one of these must be in your cart.</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px 0;font-size:13px;color:#666;line-height:1.9;">
                We are just getting started. New fragrances, new stories, and more surprises are on their way. Thank you for being here at the beginning — it truly means the world.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                <tr>
                  <td align="center">
                    <a href="https://pluteo.shop/products" style="display:inline-block;padding:14px 40px;background-color:#6c534e;color:#ffffff;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Shop Now</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f5f4;padding:22px 32px;border-top:1px solid #ede5e3;text-align:center;">
              <img
                src="https://pluteo.shop/Pluteo%20Logo%20Icon.svg"
                alt="Pluteo"
                width="30"
                height="17"
                style="display:block;margin:0 auto 12px auto;opacity:0.35;"
              />
              <p style="margin:0 0 4px 0;font-size:10px;color:#c0afab;letter-spacing:0.5px;">Vonta Grupa d.o.o &nbsp;&middot;&nbsp; Dre&#382;nik 6, 10257 Zagreb &nbsp;&middot;&nbsp; OIB: 87510848203</p>
              <p style="margin:0 0 12px 0;font-size:10px;color:#c0afab;letter-spacing:0.5px;">IBAN: HR5524020061101312303</p>
              <p style="margin:0;font-size:10px;color:#cbbfbc;">&copy; 2026 Pluteo &nbsp;&middot;&nbsp; <a href="https://pluteo.shop" style="color:#cbbfbc;text-decoration:none;">pluteo.shop</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `,
    });

    if (error) {
      console.error(`Email error for ${to}:`, error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error(`Failed to send to ${to}:`, err);
    return { success: false, error: err };
  }
}
