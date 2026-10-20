'use client';

import { useEffect } from 'react';
import { onConsentChange } from '@/lib/consent';
import { captureAttribution, clearAttribution } from '@/lib/attribution';

/**
 * Records the first-touch campaign params on whichever page a visitor lands on, once
 * analytics consent exists (also when it is granted later in the visit), and deletes
 * them when it is withdrawn.
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
    return onConsentChange((state) => {
      if (state.analytics) captureAttribution();
      else clearAttribution();
    });
  }, []);

  return null;
}
