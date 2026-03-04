import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(orderData: {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  items: any[];
  total: number;
  subtotal?: number;
  shippingCost?: number;
  deliveryMethod?: string;
  boxnowLockerAddress?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingZip?: string | null;
  promoCode?: string | null;
  promoDiscount?: number;
  paidAt?: Date | null;
}) {
  try {
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

    // PDV (10%) is included in the price
    const vatAmount = subtotal - subtotal / 1.1;

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

    const { data, error } = await resend.emails.send({
      from: 'Pluteo <orders@pluteo.shop>',
      to: [orderData.customerEmail, 'pluteoinfo@gmail.com'],
      subject: `Order Confirmation #${orderData.orderNumber}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
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
              <h1 style="margin:0 0 10px 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">Thank You for Your Order</h1>
              <p style="margin:0;color:rgba(255,255,255,0.82);font-size:13px;letter-spacing:0.5px;">Order confirmed &nbsp;·&nbsp; #${orderData.orderNumber}</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 32px 28px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px 0;font-size:16px;color:#3d2c2c;font-weight:600;">Hi ${orderData.customerName},</p>
              <p style="margin:0 0 32px 0;font-size:13px;color:#777777;line-height:1.7;">Your order has been confirmed and we're getting it ready. You'll receive a shipping update as soon as your package is on its way.</p>

              <!-- Order Items -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:6px;">
                <tr>
                  <td colspan="3" style="padding-bottom:10px;border-bottom:2px solid #6c534e;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:#6c534e;text-transform:uppercase;">Order Summary</span>
                  </td>
                </tr>
                <tr style="background-color:#faf7f6;">
                  <td style="padding:9px 8px 9px 0;font-size:10px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:1px;">Product</td>
                  <td style="padding:9px 8px;font-size:10px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:1px;text-align:center;">Qty</td>
                  <td style="padding:9px 0 9px 8px;font-size:10px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:1px;text-align:right;">Price</td>
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
              </table>

              <!-- Pricing Breakdown -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:10px 0 4px 0;font-size:13px;color:#777;">Subtotal</td>
                  <td style="padding:10px 0 4px 0;font-size:13px;color:#777;text-align:right;">&euro;${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:3px 0;font-size:11px;color:#bbb;">PDV / VAT (10% included)</td>
                  <td style="padding:3px 0;font-size:11px;color:#bbb;text-align:right;">&euro;${vatAmount.toFixed(2)}</td>
                </tr>
                ${
                  promoDiscount > 0
                    ? `<tr>
                  <td style="padding:6px 0;font-size:13px;color:#7a9e7a;">Promo${orderData.promoCode ? ' (' + orderData.promoCode + ')' : ''}</td>
                  <td style="padding:6px 0;font-size:13px;color:#7a9e7a;text-align:right;">&minus;&euro;${promoDiscount.toFixed(2)}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#777;">Shipping &nbsp;<span style="font-size:11px;color:#bbb;">(${orderData.deliveryMethod === 'boxnow' ? 'BOX NOW Locker' : 'GLS Standard'})</span></td>
                  <td style="padding:6px 0;font-size:13px;color:#777;text-align:right;">${shipping === 0 ? '<span style="color:#7a9e7a;">Free</span>' : '&euro;' + shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:4px 0;">
                    <div style="border-top:1px solid #ede5e3;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0 0 0;font-size:15px;font-weight:700;color:#3d2c2c;">Total</td>
                  <td style="padding:10px 0 0 0;font-size:17px;font-weight:700;color:#6c534e;text-align:right;">&euro;${orderData.total.toFixed(2)}</td>
                </tr>
              </table>

              <!-- Buyer + Delivery -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td width="50%" style="vertical-align:top;padding-right:16px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6c534e;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0e8e6;">Buyer</div>
                    <div style="font-size:13px;color:#3d2c2c;font-weight:600;margin-bottom:4px;">${orderData.customerName}</div>
                    <div style="font-size:12px;color:#777;margin-bottom:3px;">${orderData.customerEmail}</div>
                    ${orderData.customerPhone ? `<div style="font-size:12px;color:#777;">${orderData.customerPhone}</div>` : ''}
                  </td>
                  <td width="50%" style="vertical-align:top;padding-left:16px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#6c534e;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0e8e6;">Delivery</div>
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
                        <td style="font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:1px;">Order date</td>
                        <td style="font-size:10px;color:#bbb;text-transform:uppercase;letter-spacing:1px;text-align:right;">Contact</td>
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
                    <p style="margin:0 0 5px 0;font-size:14px;font-weight:600;color:#3d2c2c;">Thank you for choosing Pluteo</p>
                    <p style="margin:0;font-size:13px;color:#888;line-height:1.7;">We appreciate your trust and look forward to sharing our fragrances with you. If you have any questions, feel free to reach out at <a href="mailto:pluteoinfo@gmail.com" style="color:#6c534e;text-decoration:none;">pluteoinfo@gmail.com</a>.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://pluteo.shop/products" style="display:inline-block;padding:13px 34px;background-color:#6c534e;color:#ffffff;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Continue Shopping</a>
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
      console.error('Email error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
