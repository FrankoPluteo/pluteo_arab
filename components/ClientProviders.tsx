'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LanguageProvider } from '@/lib/languageContext';
import { onConsentSettingsOpen, useConsentChosen } from '@/lib/consent';
import EmailModal from './EmailModal';
import ConsentBanner from './ConsentBanner';
import MetaPixel from './MetaPixel';
import AttributionCapture from './AttributionCapture';

// Croatian-only campaign landing pages that pre-apply their own code: the newsletter
// popup would only sit between the visitor and the products.
const NO_MODAL_PATHS = ['/jesen'];

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const showModals = !NO_MODAL_PATHS.includes(usePathname());
  // null until the stored choice has been read in the browser
  const consentChosen = useConsentChosen();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => onConsentSettingsOpen(() => setSettingsOpen(true)), []);

  const bannerOpen = consentChosen === false || settingsOpen;

  return (
    <LanguageProvider>
      {children}
      {/* The cookie banner comes first: the newsletter popup only mounts once a choice
          exists and the banner is closed, then keeps its own delay. */}
      {showModals && consentChosen === true && !bannerOpen && <EmailModal />}
      {bannerOpen && (
        <ConsentBanner startInSettings={settingsOpen} onDone={() => setSettingsOpen(false)} />
      )}
      <MetaPixel />
      <AttributionCapture />
    </LanguageProvider>
  );
}
