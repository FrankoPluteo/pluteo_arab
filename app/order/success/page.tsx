import { Suspense } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CONSENT_COOKIE_NAME, decodeConsent } from "@/lib/consentCookie";
import { isCheckoutSessionPaid } from "@/lib/stripe";
import OrderSuccessClient, { type PurchaseData } from "./OrderSuccessClient";

interface StoredItem {
  product: { id: string };
  quantity: number;
  unitPrice: number;
}

/**
 * The Purchase data for the pixel, only when the order behind this Stripe session is
 * confirmed paid. The session_id in the URL is just a lookup key: payment is checked on
 * our Order row, and against Stripe while the webhook has not marked the order yet.
 */
async function getConfirmedPurchase(
  sessionId: string | undefined,
  analyticsConsent: boolean
): Promise<PurchaseData | null> {
  if (!sessionId) return null;

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: { id: true, total: true, items: true, paymentStatus: true, customerEmail: true, createdAt: true },
  });
  if (!order) return null;

  let paid = order.paymentStatus === "paid";
  if (!paid && order.paymentStatus === "pending") {
    try {
      paid = await isCheckoutSessionPaid(sessionId);
    } catch (error) {
      console.error("[order/success] Stripe session check failed", error);
    }
  }
  if (!paid) return null;

  // Orders store their items as a JSON string (see /api/checkout). The free tester is
  // kept separately in testerItem and is not part of the purchase.
  const items: StoredItem[] = typeof order.items === "string" ? JSON.parse(order.items) : (order.items as unknown as StoredItem[]);
  // Stored amounts carry float noise (29.990000000000002), so report whole cents.
  const toCents = (amount: number) => Math.round(amount * 100) / 100;
  const contents = items.map((item) => ({
    id: item.product.id,
    quantity: item.quantity,
    item_price: toCents(item.unitPrice),
  }));

  return {
    orderId: order.id,
    value: toCents(order.total),
    contents,
    buyer: analyticsConsent ? await getBuyer(order.customerEmail, order.createdAt) : null,
  };
}

/**
 * Who to identify in PostHog. Only called with analytics consent, so without it the email
 * never reaches the client payload. first_order_at is the buyer's earliest paid order.
 */
async function getBuyer(email: string, thisOrderAt: Date): Promise<NonNullable<PurchaseData["buyer"]>> {
  const first = await prisma.order.findFirst({
    where: { customerEmail: email, paymentStatus: "paid" },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  return { email, firstOrderAt: (first?.createdAt ?? thisOrderAt).toISOString() };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const { session_id } = await searchParams;
  // The banner mirrors the choice in this cookie, so the server can respect it too.
  const analyticsConsent = decodeConsent((await cookies()).get(CONSENT_COOKIE_NAME)?.value)?.analytics === true;
  // Tracking must never break the page a paying customer lands on.
  const purchase = await getConfirmedPurchase(
    typeof session_id === "string" ? session_id : undefined,
    analyticsConsent
  ).catch(
    (error) => {
      console.error("[order/success] purchase lookup failed", error);
      return null;
    }
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccessClient purchase={purchase} />
    </Suspense>
  );
}
