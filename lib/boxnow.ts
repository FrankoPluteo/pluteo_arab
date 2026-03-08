const BOXNOW_API_URL = process.env.BOXNOW_API_URL || 'https://api-production.boxnow.hr';
const BOXNOW_CLIENT_ID = process.env.BOXNOW_CLIENT_ID || '';
const BOXNOW_CLIENT_SECRET = process.env.BOXNOW_CLIENT_SECRET || '';
const BOXNOW_WAREHOUSE_ID = process.env.BOXNOW_WAREHOUSE_ID || '2';

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${BOXNOW_API_URL}/api/v1/auth-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: BOXNOW_CLIENT_ID,
      client_secret: BOXNOW_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BoxNow auth failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return phone.replace(/\s/g, '');
  if (digits.startsWith('00385')) return '+' + digits.slice(2);
  if (digits.startsWith('385')) return '+' + digits;
  if (digits.startsWith('0')) return '+385' + digits.slice(1);
  return '+385' + digits;
}

export async function createBoxNowDeliveryRequest(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  lockerId: string;
  invoiceValue: string;
}): Promise<{ referenceNumber: string; parcels: Array<{ id: string }> }> {
  const token = await getAccessToken();

  const response = await fetch(`${BOXNOW_API_URL}/api/v1/delivery-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderNumber: params.orderNumber,
      invoiceValue: params.invoiceValue,
      paymentMode: 'prepaid',
      amountToBeCollected: '0.00',
      allowReturn: true,
      origin: {
        locationId: BOXNOW_WAREHOUSE_ID,
      },
      destination: {
        contactNumber: normalizePhone(params.customerPhone),
        contactEmail: params.customerEmail,
        contactName: params.customerName,
        locationId: params.lockerId,
      },
      items: [
        {
          id: params.orderNumber,
          name: 'Parfem',
          value: params.invoiceValue,
          weight: 0.5,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`BoxNow delivery request failed (${response.status}): ${errorText}`);
  }

  return response.json();
}
