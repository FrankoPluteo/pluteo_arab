import { prisma } from '@/lib/prisma';
import { findOrCreateMinimaxCustomer } from './customer';
import { getMinimaxItemId } from './item';
import { buildIssuedInvoicePayload, submitIssuedInvoice, InvoiceLineInput } from './invoice';

interface OrderItem {
  product: { id: string; name: string };
  quantity: number;
  unitPrice: number;
}

// Runs the full Minimax flow for one order: find/create the customer, resolve each
// line item's Minimax ItemId, submit the issued invoice, and record the result on the
// Order. Never throws — callers (the Stripe webhook today, a retry cron later) must be
// able to call this without it ever failing their own request.
export async function fiscalizeOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    console.error(`Minimax fiscalization skipped: order ${orderId} not found`);
    return;
  }

  if (order.minimaxJir) {
    console.log(`Order ${order.orderNumber} already fiscalized (JIR ${order.minimaxJir}), skipping`);
    return;
  }

  try {
    const items = JSON.parse(order.items as string) as OrderItem[];

    // Item-level discounts are already baked into unitPrice, but promo/affiliate
    // discounts are applied at the order level (as a Stripe coupon), not per line.
    // (order.total - order.shippingCost) is exactly the items subtotal after those
    // order-level discounts too, so scaling each unitPrice by that ratio yields the
    // final price the customer actually paid for that line.
    const discountedItemsTotal = order.total - order.shippingCost;
    const scale = order.subtotal > 0 ? discountedItemsTotal / order.subtotal : 1;

    const dbProducts = await prisma.product.findMany({
      where: { id: { in: items.map((item) => item.product.id) } },
      select: { id: true, minimaxSku: true },
    });
    const skuByProductId = new Map(dbProducts.map((p) => [p.id, p.minimaxSku]));

    const customerId = await findOrCreateMinimaxCustomer({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingZip: order.shippingZip,
    });

    const lines: InvoiceLineInput[] = [];
    for (const item of items) {
      const sku = skuByProductId.get(item.product.id);
      if (!sku) {
        throw new Error(`Product "${item.product.name}" (${item.product.id}) has no minimaxSku set`);
      }
      const itemId = await getMinimaxItemId(sku);
      lines.push({
        itemId,
        quantity: item.quantity,
        unitPrice: parseFloat((item.unitPrice * scale).toFixed(2)),
      });
    }

    const payload = buildIssuedInvoicePayload(order, customerId, lines);
    const result = await submitIssuedInvoice(payload);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        minimaxInvoiceNumber: result.invoiceNumber,
        minimaxJir: result.jir,
        fiscalizationStatus: 'success',
        fiscalizedAt: new Date(),
      },
    });

    console.log(`Order ${order.orderNumber} fiscalized via Minimax: invoice ${result.invoiceNumber}`);
  } catch (error) {
    console.error(`Minimax fiscalization failed for order ${order.orderNumber}:`, error);
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { fiscalizationStatus: 'failed' },
      });
    } catch (updateError) {
      console.error(`Failed to record fiscalizationStatus=failed for order ${order.orderNumber}:`, updateError);
    }
  }
}
