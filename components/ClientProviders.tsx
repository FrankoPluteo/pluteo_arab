'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LanguageProvider } from '@/lib/languageContext';
import LanguageSelectorModal from './LanguageSelectorModal';
import EmailModal from './EmailModal';

// Reuse the same key written by languageContext — if it exists the user
// has already been through the language selector on a prior visit.
const LANG_KEY = 'pluteo-language';

// Croatian-only campaign landing pages that pre-apply their own code: the language
// picker and the newsletter popup would only sit between the visitor and the products.
const NO_MODAL_PATHS = ['/jesen'];

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // null = haven't read localStorage yet; true/false = result
  const [langChosen, setLangChosen] = useState<boolean | null>(null);
  const showModals = !NO_MODAL_PATHS.includes(usePathname());

  useEffect(() => {
    setLangChosen(!!localStorage.getItem(LANG_KEY));
  }, []);

  return (
    <LanguageProvider>
      {children}
      {/* Don't render any modal until we've checked localStorage */}
      {showModals && langChosen === false && (
        <LanguageSelectorModal onComplete={() => setLangChosen(true)} />
      )}
      {showModals && langChosen === true && <EmailModal />}
    </LanguageProvider>
  );
}
