'use client';

import { useState, useEffect } from 'react';
import { LanguageProvider } from '@/lib/languageContext';
import LanguageSelectorModal from './LanguageSelectorModal';
import EmailModal from './EmailModal';

// Reuse the same key written by languageContext — if it exists the user
// has already been through the language selector on a prior visit.
const LANG_KEY = 'pluteo-language';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // null = haven't read localStorage yet; true/false = result
  const [langChosen, setLangChosen] = useState<boolean | null>(null);

  useEffect(() => {
    setLangChosen(!!localStorage.getItem(LANG_KEY));
  }, []);

  return (
    <LanguageProvider>
      {children}
      {/* Don't render any modal until we've checked localStorage */}
      {langChosen === false && (
        <LanguageSelectorModal onComplete={() => setLangChosen(true)} />
      )}
      {langChosen === true && <EmailModal />}
    </LanguageProvider>
  );
}
