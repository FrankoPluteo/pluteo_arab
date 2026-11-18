// ─── BLACK FRIDAY WEEK (temporary campaign) ──────────────────────────────────
// Police-tape decoration on the home hero, the home gift panel and every product card.
// It switches itself off at BLACK_FRIDAY_END, so nothing breaks if nobody removes it.
//
// To remove it for good, revert the "Black Friday week" commit, or delete:
//   lib/blackFriday.ts, components/BlackFridayTape.tsx, styles/blackfriday.module.css,
//   public/black-friday-tape.svg and the <BlackFridayTape> lines marked
//   "BLACK FRIDAY" in app/HomeContent.tsx and components/ProductCard.tsx.

/** Tape disappears from this moment on (00:00 Zagreb time on 3 Dec 2026). */
export const BLACK_FRIDAY_END = new Date('2026-12-03T00:00:00+01:00');

export function isBlackFridayActive(now: Date = new Date()): boolean {
  return now < BLACK_FRIDAY_END;
}
