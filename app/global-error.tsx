'use client';

import { useEffect } from 'react';
import { captureError } from '@/lib/analytics';

// Last resort, for errors in the root layout itself. It replaces the whole document, so
// there are no providers (language, consent), no navbar and no global CSS: Croatian only,
// inline styles, and a plain link that reloads the site.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest, boundary: 'global' });
  }, [error]);

  return (
    <html lang="hr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          background: '#ffffff',
          color: '#111111',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 11, fontWeight: 400, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 32 }}>
            Nešto je pošlo po krivu
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: '#555555', marginBottom: 32 }}>
            Stranica se nije mogla učitati. Greška nam je prijavljena. Pokušaj ponovno, a ako se
            ponavlja, piši nam na pluteoinfo@gmail.com.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              width: '100%',
              maxWidth: 320,
              padding: 14,
              background: '#111111',
              color: '#ffffff',
              border: '1px solid #111111',
              fontSize: 10,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Pokušaj ponovno
          </button>
          <p style={{ marginTop: 24, fontSize: 14 }}>
            {/* A full page load on purpose: the app shell is what broke. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ color: '#111111' }}>
              Natrag na početnu
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
