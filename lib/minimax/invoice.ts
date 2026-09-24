import { minimaxFetch } from './client';

// Shipping is invoiced as its own catalog item (Type: Usluga) so that the invoice rows
// always sum to the same total as the payment amount, instead of the order total silently
// including a shipping cost with no row behind it.
export const SHIPPING_ITEM_SKU = 'DOSTAVA';

export interface InvoiceLineInput {
  itemId: number;
  quantity: number;
  unitPrice: number; // final price per unit, already net of all discounts/promo/referral codes
}

interface OrderForInvoice {
  total: number;
  shippingCost: number;
}

export function buildIssuedInvoicePayload(
  order: OrderForInvoice,
  customerId: number,
  lines: InvoiceLineInput[],
  shippingItemId: number | null
) {
  const today = new Date().toISOString().slice(0, 10);
  const vatRate = { ID: Number(process.env.MINIMAX_VAT_RATE_ID) };

  const rows = lines.map((line, index) => ({
    RowNumber: index + 1,
    Item: { ID: line.itemId },
    Quantity: line.quantity,
    UnitOfMeasurement: 'kom',
    Price: line.unitPrice,
    VatRate: vatRate,
    VATPercent: 0,
  }));

  if (order.shippingCost > 0) {
    if (!shippingItemId) {
      throw new Error('Order has shippingCost > 0 but no shippingItemId was resolved for the DOSTAVA row');
    }
    rows.push({
      RowNumber: rows.length + 1,
      Item: { ID: shippingItemId },
      Quantity: 1,
      UnitOfMeasurement: 'kom',
      Price: order.shippingCost,
      VatRate: vatRate,
      VATPercent: 0,
    });
  }

  return {
    Customer: { ID: customerId },
    DateIssued: today,
    DateTransaction: today,
    DateDue: today,
    DocumentNumbering: { ID: Number(process.env.MINIMAX_DOCUMENT_NUMBERING_ID) },
    Employee: { ID: Number(process.env.MINIMAX_EMPLOYEE_ID) },
    // Required even though it's not settable via the payload the task described — without
    // it Minimax rejects the draft outright ("Nepravilna oznaka za vrstu računa.").
    InvoiceType: 'R',
    IssuedInvoiceRows: rows,
    IssuedInvoicePaymentMethods: [
      {
        PaymentMethod: { ID: Number(process.env.MINIMAX_PAYMENT_METHOD_ID) },
        Amount: order.total,
        AlreadyPaid: 'D',
      },
    ],
  };
}

export type IssuedInvoicePayload = ReturnType<typeof buildIssuedInvoicePayload>;

export interface SubmitIssuedInvoiceResult {
  invoiceNumber: string | null;
  jir: string | null;
}

function extractInvoiceId(locationHeader: string | null): number {
  const match = locationHeader?.match(/\/issuedinvoices\/(\d+)/);
  if (!match) {
    throw new Error(`Minimax invoice creation succeeded but no IssuedInvoiceId found in Location header: ${locationHeader}`);
  }
  return Number(match[1]);
}

// The JIR (fiscalization id) is not exposed as a JSON field anywhere in the IssuedInvoice
// API — confirmed by inspecting the full invoice response after issuing a real test invoice.
// It only appears printed on the generated invoice PDF (next to the ZKI), so it has to be
// extracted from that document's text.
async function extractJirFromAttachment(documentId: number, attachmentId: number): Promise<string | null> {
  const response = await minimaxFetch(`/documents/${documentId}/attachments/${attachmentId}`);
  if (!response.ok) {
    console.warn(`Could not fetch invoice PDF attachment ${attachmentId} to extract JIR (${response.status})`);
    return null;
  }

  const attachment = await response.json();
  const buffer = Buffer.from(attachment.AttachmentData, 'base64');
  // Loaded lazily: a static import made pdf-parse/pdfjs load with the Stripe webhook route,
  // and when that load failed on Vercel every webhook returned 500 before marking orders paid.
  // pdf-parse/worker must load first: it provides the canvas polyfills (DOMMatrix etc.) pdfjs
  // needs in Node, and the worker as a data URL so no worker file has to be found on disk.
  const { CanvasFactory, getData } = await import('pdf-parse/worker');
  const { PDFParse } = await import('pdf-parse');
  PDFParse.setWorker(getData());
  const parser = new PDFParse({ data: buffer, CanvasFactory });
  let text: string;
  try {
    ({ text } = await parser.getText());
  } finally {
    await parser.destroy();
  }

  return text.match(/JIR:\s*([0-9a-fA-F-]{36})/)?.[1] ?? null;
}

export async function submitIssuedInvoice(payload: IssuedInvoicePayload): Promise<SubmitIssuedInvoiceResult> {
  // 1. Create the invoice — this only creates a Draft (Status "O"), it does not fiscalize.
  const created = await minimaxFetch('/issuedinvoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!created.ok) {
    const text = await created.text();
    throw new Error(`Minimax invoice creation failed (${created.status}): ${text}`);
  }

  const invoiceId = extractInvoiceId(created.headers.get('location'));

  // 2. The 'issue' action requires the draft's current RowVersion (optimistic concurrency),
  // which isn't returned by the create call (its response body is empty), so fetch it first.
  const draftResponse = await minimaxFetch(`/issuedinvoices/${invoiceId}`);
  if (!draftResponse.ok) {
    const text = await draftResponse.text();
    throw new Error(`Minimax invoice fetch after creation failed (${draftResponse.status}): ${text}`);
  }
  const draft = await draftResponse.json();

  // 3. Issue the draft — this is the actual fiscalization trigger on the Web/2 series
  // (confirmed: Status flips from "O" to "I" and a real InvoiceNumber/JIR/ZKI get assigned
  // only after this call, not on creation).
  const issueResponse = await minimaxFetch(
    `/issuedinvoices/${invoiceId}/actions/issue?rowVersion=${encodeURIComponent(draft.RowVersion)}`,
    { method: 'PUT', body: JSON.stringify({}) }
  );

  if (!issueResponse.ok) {
    const text = await issueResponse.text();
    throw new Error(`Minimax invoice issue action failed (${issueResponse.status}): ${text}`);
  }

  const { Data: issued } = await issueResponse.json();
  const invoiceNumber = issued?.InvoiceNumber && issued?.DocumentNumbering?.Name
    ? `${issued.InvoiceNumber}/${issued.DocumentNumbering.Name}`
    : null;

  let jir: string | null = null;
  const documentId = issued?.Document?.ID;
  const attachmentId = issued?.InvoiceAttachment?.ID;
  if (documentId && attachmentId) {
    // The invoice is already issued at this point, so a failure reading the PDF must not
    // bubble up and make the caller treat (and later retry) the whole order as failed.
    try {
      jir = await extractJirFromAttachment(documentId, attachmentId);
    } catch (error) {
      console.error(`Minimax invoice ${invoiceNumber} issued but JIR extraction threw:`, error);
    }
  }
  if (!jir) {
    console.warn(`Minimax invoice ${invoiceNumber} issued but JIR could not be extracted`);
  }

  return { invoiceNumber, jir };
}
