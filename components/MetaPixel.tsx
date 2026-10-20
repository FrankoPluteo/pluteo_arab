'use client';

import { useEffect } from 'react';
import { hasMarketingConsent, onConsentChange } from '@/lib/consent';
import { loadMetaPixel, revokeMetaPixel } from '@/lib/metaPixel';

/** Loads the Meta Pixel only once the visitor has accepted marketing cookies. */
export default function MetaPixel() {
  useEffect(() => {
    if (hasMarketingConsent()) loadMetaPixel();
    return onConsentChange((state) => {
      if (state.marketing) loadMetaPixel();
      else revokeMetaPixel();
    });
  }, []);

  return null;
}
