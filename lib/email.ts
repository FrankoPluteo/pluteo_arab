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
      from: 'Pluteo <orders@pluteo.shop>', // Changed to your verified domain!
      to: [orderData.customerEmail],
      subject: `Order Confirmation #${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Montserrat', Arial, sans-serif; 
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background-color: white;
            }
            .header { 
              background: linear-gradient(to right, #6c534e, #A67F8E); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content { 
              padding: 40px 30px; 
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .order-details { 
              background: #f9f9f9; 
              padding: 25px; 
              margin: 25px 0; 
              border-radius: 8px;
              border-left: 4px solid #6c534e;
            }
            .order-details h2 {
              margin-top: 0;
              color: #6c534e;
              font-size: 20px;
            }
            .item { 
              padding: 15px 0; 
              border-bottom: 1px solid #e0e0e0; 
            }
            .item:last-child { 
              border-bottom: none; 
            }
            .item-name {
              font-weight: 600;
              color: #333;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .item-details {
              color: #666;
              font-size: 14px;
            }
            .item-price {
              color: #6c534e;
              font-weight: 700;
              font-size: 16px;
              margin-top: 5px;
            }
            .total-section {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #ddd;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 15px;
            }
            .total-row.grand-total {
              font-size: 22px;
              font-weight: 700;
              color: #6c534e;
              padding-top: 15px;
              border-top: 2px solid #6c534e;
              margin-top: 10px;
            }
            .message {
              background-color: #f0f8ff;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
              border-left: 4px solid #A67F8E;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              color: #666; 
              font-size: 14px;
              border-top: 1px solid #e0e0e0;
            }
            .footer a {
              color: #6c534e;
              text-decoration: none;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #6c534e;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Order! 🎁</h1>
              <p>Order #${orderData.orderNumber}</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${orderData.customerName},</p>
              
              <p>Thank you for shopping with Pluteo! We're excited to get your order ready.</p>
              
              <div class="order-details">
                <h2>Order Summary</h2>
                ${orderData.items.map(item => {
                  const itemPrice = (item.product.price - item.product.discountAmount).toFixed(2);
                  const itemTotal = ((item.product.price - item.product.discountAmount) * item.quantity).toFixed(2);
                  return `
                    <div class="item">
                      <div class="item-name">${item.product.brand.name} - ${item.product.name}</div>
                      <div class="item-details">
                        ${item.product.concentration} • ${item.product.size}ml • Quantity: ${item.quantity}
                      </div>
                      <div class="item-price">€${itemTotal}</div>
                    </div>
                  `;
                }).join('')}
                
                <div class="total-section">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>€${(orderData.total - 4.99).toFixed(2)}</span>
                  </div>
                  <div class="total-row">
                    <span>Shipping:</span>
                    <span>€4.99</span>
                  </div>
                  <div class="total-row grand-total">
                    <span>Total:</span>
                    <span>€${orderData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <center>
                <a href="https://pluteo.shop/products" class="button">Continue Shopping</a>
              </center>
            </div>
            
            <div class="footer">
              <p><strong>Questions about your order?</strong></p>
              <p>Contact us at <a href="mailto:support@pluteo.shop">support@pluteo.shop</a></p>
              <p style="margin-top: 20px;">© 2026 Pluteo. All rights reserved.</p>
              <p><a href="https://pluteo.shop">pluteo.shop</a></p>
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