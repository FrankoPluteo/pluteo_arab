import type { ReactNode } from 'react';
import { Playfair_Display } from 'next/font/google';

// Headings only. Body text stays on the Inter the root layout already loads.
// latin-ext carries č, ć, đ, š, ž.
const display = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-jesen-display',
  display: 'swap',
});

// The campaign page brings its own header, so hide the global Navbar on this
// route only and match the page background for overscroll on mobile.
// The Navbar sits outside <main>; the shared Footer's <nav> lists sit inside it.
export default function JesenLayout({ children }: { children: ReactNode }) {
  return (
    <div className={display.variable}>
      <style>{`
        nav:not(main nav) { display: none !important; }
        body { background-color: #230007; }
      `}</style>
      {children}
    </div>
  );
}
