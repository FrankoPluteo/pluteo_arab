import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(orderData: {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: any[];
  total: number;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Pluteo Arab <onboarding@resend.dev>', // Changed to Resend's test email
      to: [orderData.customerEmail],
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #6c534e, #A67F8E); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background: #f9f9f9; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .item { padding: 15px; border-bottom: 1px solid #eee; }
            .item:last-child { border-bottom: none; }
            .total { font-size: 20px; font-weight: bold; padding: 20px; text-align: right; background: #f0f0f0; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Thank You for Your Order!</h1>
              <p style="margin: 10px 0 0 0;">Order #${orderData.orderNumber}</p>
            </div>
            
            <div class="content">
              <p>Hi ${orderData.customerName},</p>
              <p>We've received your order and it's being processed. Here are your order details:</p>
              
              <div class="order-details">
                <h2 style="margin-top: 0;">Order Items</h2>
                ${orderData.items.map(item => `
                  <div class="item">
                    <strong>${item.product.brand.name} - ${item.product.name}</strong><br>
                    <span style="color: #666;">${item.product.size}ml × ${item.quantity}</span><br>
                    <strong style="color: #6c534e;">$${((item.product.price - item.product.discountAmount) * item.quantity).toFixed(2)}</strong>
                  </div>
                `).join('')}
                
                <div class="total">
                  Total: $${orderData.total.toFixed(2)}
                </div>
              </div>
              
              <p>We'll send you another email when your order ships.</p>
            </div>
            
            <div class="footer">
              <p>Questions? Contact us at support@pluteoarab.com</p>
              <p>&copy; 2026 Pluteo Arab. All rights reserved.</p>
            </div>
          </div>
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