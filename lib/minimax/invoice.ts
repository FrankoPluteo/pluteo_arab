import { PDFParse } from 'pdf-parse';
import { minimaxFetch } from './client';

export interface InvoiceLineInput {
  itemId: number;
  quantity: number;
  unitPrice: number; // final price per unit, already net of all discounts/promo/referral codes
}

interface OrderForInvoice {
  total: number;
}

export function buildIssuedInvoicePayload(
  order: OrderForInvoice,
  customerId: number,
  lines: InvoiceLineInput[]
) {
  const today = new Date().toISOString().slice(0, 10);

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
    IssuedInvoiceRows: lines.map((line, index) => ({
      RowNumber: index + 1,
      Item: { ID: line.itemId },
      Quantity: line.quantity,
      UnitOfMeasurement: 'kom',
      Price: line.unitPrice,
      VatRate: { ID: Number(process.env.MINIMAX_VAT_RATE_ID) },
      VATPercent: 0,
    })),
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
  const parser = new PDFParse({ data: buffer });
  const { text } = await parser.getText();

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
    jir = await extractJirFromAttachment(documentId, attachmentId);
  }
  if (!jir) {
    console.warn(`Minimax invoice ${invoiceNumber} issued but JIR could not be extracted`);
  }

  return { invoiceNumber, jir };
}
