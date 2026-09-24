import { prisma } from '@/lib/prisma';
import { getBoxNowLockerLocation } from '@/lib/boxnow';
import { findOrCreateMinimaxCustomer } from './customer';
import { getMinimaxItemId } from './item';
import { buildIssuedInvoicePayload, submitIssuedInvoice, InvoiceLineInput, SHIPPING_ITEM_SKU } from './invoice';

interface OrderItem {
  product: { id: string; name: string };
  quantity: number;
  unitPrice: number;
}

// Minimax won't create a customer without a city and postal code. BoxNow orders have
// neither (the buyer only picks a locker), so the locker's own address is used instead.
async function customerAddressForOrder(order: {
  shippingMethod: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  boxnowLockerId: string | null;
}): Promise<{ shippingAddress: string; shippingCity: string; shippingZip: string }> {
  const current = {
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingZip: order.shippingZip,
  };
  if (order.shippingMethod !== 'boxnow' || (order.shippingCity && order.shippingZip)) {
    return current;
  }
  if (!order.boxnowLockerId) {
    throw new Error('BoxNow order has no locker id, cannot resolve customer city/postal code');
  }

  const locker = await getBoxNowLockerLocation(order.boxnowLockerId);
  if (!locker?.city || !locker.postalCode) {
    throw new Error(`BoxNow locker ${order.boxnowLockerId} not found or has no city/postal code`);
  }
  return {
    shippingAddress: locker.address,
    shippingCity: locker.city,
    shippingZip: locker.postalCode,
  };
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

  // An invoice number means an invoice was already issued in Minimax (even if the JIR
  // couldn't be read off it), and issuing again would create a duplicate fiscal invoice.
  if (order.minimaxJir || order.minimaxInvoiceNumber) {
    console.log(`Order ${order.orderNumber} already fiscalized (invoice ${order.minimaxInvoiceNumber}, JIR ${order.minimaxJir}), skipping`);
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
      ...(await customerAddressForOrder(order)),
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

    const shippingItemId = order.shippingCost > 0 ? await getMinimaxItemId(SHIPPING_ITEM_SKU) : null;

    const payload = buildIssuedInvoicePayload(order, customerId, lines, shippingItemId);
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
