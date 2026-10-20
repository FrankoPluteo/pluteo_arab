import type { ReactNode } from 'react';

// The campaign page brings its own header, so hide the global Navbar on this
// route only and match the page background for overscroll on mobile.
export default function JesenLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        nav { display: none !important; }
        body { background-color: #230007; }
      `}</style>
      {children}
    </>
  );
}
