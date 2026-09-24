import { NextResponse } from 'next/server';
import { runLoyaltyEmailJob } from '@/lib/loyaltyEmail';
import { isWithinSendWindow } from '@/lib/abandonedCart';

export const maxDuration = 60;

// Daily Vercel cron (see vercel.json). Vercel calls it with GET and sends
// "Authorization: Bearer <CRON_SECRET>" automatically once CRON_SECRET is set in the
// project's environment variables. POST is accepted too for manual runs.
//
// Both flags are off by default:
//   LOYALTY_EMAIL_ENABLED=true   turns the job on (otherwise it returns "disabled")
//   LOYALTY_EMAIL_DRY_RUN=true   evaluates everyone but creates no codes and sends nothing
// ?dryRun=1 forces a dry run for a single call, even while the job is disabled. It can only
// make a run safer, never cause a real send.
async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const forcedDryRun = new URL(request.url).searchParams.get('dryRun') === '1';
  const enabled = process.env.LOYALTY_EMAIL_ENABLED === 'true';
  const dryRun = forcedDryRun || process.env.LOYALTY_EMAIL_DRY_RUN === 'true';

  if (!enabled && !forcedDryRun) {
    return NextResponse.json({ skipped: true, reason: 'disabled' });
  }

  // Same 09:00 to 21:00 Europe/Zagreb window as the abandoned cart emails. Dry runs ignore it.
  if (!dryRun && !isWithinSendWindow(new Date())) {
    return NextResponse.json({ skipped: true, reason: 'outside_send_window' });
  }

  const { rows, tally } = await runLoyaltyEmailJob({ dryRun });
  console.log('Loyalty email cron run complete', { dryRun, tally });
  return NextResponse.json({ dryRun, tally, rows });
}

export const GET = handle;
export const POST = handle;
