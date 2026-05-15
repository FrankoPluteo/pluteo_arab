import type { ReactNode } from 'react';

// Override the root layout's Navbar by injecting a CSS rule that hides it
// only on this route. Using a scoped <style> tag avoids touching the Navbar
// component itself.
export default function LjetoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        /* Hide global Navbar on the /ljeto campaign page */
        nav { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
