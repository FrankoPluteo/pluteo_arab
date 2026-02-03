import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const subjectLabels: Record<string, string> = {
      order: 'Order Inquiry',
      product: 'Product Question',
      shipping: 'Shipping & Delivery',
      return: 'Returns & Exchanges',
      other: 'Other',
    };

    // Send email TO pluteoinfo@gmail.com (your inbox)
    const { error } = await resend.emails.send({
      from: 'Pluteo Contact <orders@pluteo.shop>',
      to: ['pluteoinfo@gmail.com'],
      replyTo: email, // So you can reply directly to the customer
      subject: `[Pluteo] ${subjectLabels[subject] || subject} - from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; background: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(to right, #6c534e, #A67F8E); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .field { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .field:last-child { border-bottom: none; }
            .field-label { font-size: 12px; font-weight: 700; color: #6c534e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
            .field-value { font-size: 15px; color: #333; }
            .message-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 13px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Message</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">From</div>
                <div class="field-value">${name}</div>
              </div>
              <div class="field">
                <div class="field-label">Email</div>
                <div class="field-value">${email}</div>
              </div>
              <div class="field">
                <div class="field-label">Subject</div>
                <div class="field-value">${subjectLabels[subject] || subject}</div>
              </div>
              <div class="field">
                <div class="field-label">Message</div>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              <p>This message was sent via Pluteo Contact Form</p>
              <p>Reply directly to this email to respond to the customer.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Send confirmation email TO the customer
    await resend.emails.send({
      from: 'Pluteo <orders@pluteo.shop>',
      to: [email],
      subject: 'We received your message!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; background: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(to right, #6c534e, #A67F8E); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; text-align: center; }
            .content p { color: #555; font-size: 16px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 13px; border-top: 1px solid #eee; }
            .footer a { color: #6c534e; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You, ${name}!</h1>
            </div>
            <div class="content">
              <p>We have received your message and will get back to you as soon as possible.</p>
              <p>Usually we respond within <strong>24 hours</strong>.</p>
              <p style="color: #999; font-size: 14px;">If it's urgent, feel free to reach out at <a href="mailto:pluteoinfo@gmail.com" style="color: #6c534e;">pluteoinfo@gmail.com</a></p>
            </div>
            <div class="footer">
              <p>© 2026 Pluteo. All rights reserved.</p>
              <p><a href="https://pluteo.shop">pluteo.shop</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}