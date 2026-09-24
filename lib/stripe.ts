import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Stripe is the source of truth for whether a checkout was paid. The Order row can lag
// behind (e.g. while the webhook is failing), so anything that would treat an order as
// abandoned should check here before acting on it.
export async function isCheckoutSessionPaid(sessionId: string): Promise<boolean> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
}
