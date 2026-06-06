# pluteo.shop — Claude Code Context

## Project Overview
**pluteo.shop** is a Croatian e-commerce fragrance shop selling Arabic/oriental perfumes (primarily Lattafa and Armaf brands). Operated under **Vonta Grupa d.o.o.**, sole founder/operator.

## Tech Stack
- **Framework**: Next.js (App Router)
- **ORM**: Prisma
- **Database**: Neon (PostgreSQL)
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel
- **Language**: TypeScript

## Key Business Context
- Target market: Croatian customers
- Primary content language: **Croatian** (hr-HR)
- Top revenue driver: Khamrah Dukhan
- Active brands: Lattafa, Armaf
- Affiliate/promo code system active (PETRA15, LJETO15, etc.)
- Tester program accompanies most paid orders
- Box Now integration for parcel lockers

## Project Structure Conventions
- Pages in `app/` directory (App Router)
- Components in `components/`
- API routes in `app/api/`
- Prisma schema in `prisma/schema.prisma`
- Environment variables in `.env.local`

## Code Style Rules
- **TypeScript** always — no `any` types without comment
- **Server Components** by default; add `"use client"` only when necessary
- Prisma queries in server components or API routes, never client-side
- Error handling: always try/catch on async operations with meaningful error messages
- Croatian UI copy — never leave placeholder English text in UI components

## Frontend Design Rules — NO GENERIC AI AESTHETICS
- **NEVER** use Inter, Roboto, Arial, or system-ui as primary fonts
- **NEVER** use purple gradients on white backgrounds
- **NEVER** use generic card grid layouts without intentional composition
- Use CSS variables for all colors and spacing
- Maintain existing design tokens from `tailwind.config.js`
- Micro-interactions on hover/focus states
- Mobile-first — most pluteo.shop traffic is mobile
- Product images: 4:5 ratio preferred, subject ~20% of frame

## Current Design System
- Primary color: check `tailwind.config.js` for current palette
- Font stack: check `app/layout.tsx` for current fonts
- Component patterns: follow existing components before introducing new patterns

## Business Logic — Critical
- **Promo codes**: stored in DB, always validate server-side, never expose discount logic client-side
- **Stock management**: check Prisma schema for current stock fields
- **Tester program**: testers are linked to orders — don't break this relation
- **GDPR**: Croatian law applies — no unnecessary data collection, cookie consent required
- **Tax**: Croatian VAT (25%) on all domestic sales; EU OSS threshold awareness

## Email (Resend)
- All transactional emails via Resend
- Templates in Croatian
- Watch for duplicate send bugs — always check idempotency
- Abandoned checkout flow: check current implementation status before modifying

## Integrations
- **Box Now**: webhook-based parcel locker integration — handle webhook idempotency
- **Meta Pixel**: active for ad tracking — don't remove or break pixel events
- **Google Shopping**: product feed active — keep product data schema consistent
- **Stripe**: webhooks for payment confirmation — always verify webhook signatures

## When Making Changes
1. Check existing Prisma schema before adding new fields
2. Run `npx prisma generate` after schema changes
3. Test on mobile viewport first (360px minimum)
4. Croatian copy — when in doubt, ask rather than guess translation
5. Don't break existing promo code or affiliate tracking logic
6. Stripe webhooks must remain idempotent

## Environment Variables (never hardcode)
- `DATABASE_URL` — Neon connection string
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Check `.env.local` for full list — never commit secrets

## Active Campaigns / Features (as of mid-2025)
- **Miris Ljeta**: landing page at `/ljeto`, promo code `LJETO15`, Meta Ads campaign
- **Affiliate program**: in development, Croatian tax compliance (JOPPD/drugi dohodak) scoped
- **Email list growth**: primary KPI for current campaign

## Home Page Redesign Brief

### Visual Direction
Reference aesthetic: "Havena" layout (clean editorial ecommerce) but adapted for luxury Arabic perfumery.
- **NOT** beige/cream/neutral — that's home decor, not perfume
- **YES** deep dark backgrounds (near-black #0D0B09 or deep espresso #1A1208)
- **YES** gold/amber accents (#C9A96E or #D4AF70) for CTAs, borders, highlights
- **YES** warm off-white (#F5F0E8) for body text, never pure white
- Serif display font for headings — suggest: Cormorant Garamond, Playfair Display, or similar
- Clean sans-serif for body — suggest: DM Sans, Jost, or similar

### Navbar
Redesign navbar to match the Havena reference aesthetic:
- Logo lijevo, navigacijski linkovi u centru, ikone (pretraživanje, košarica) desno
- Minimalist, thin font weight za nav linkove
- Transparentan na hero sekciji, postaje solid pri scrollu (backdrop-blur efekt)
- Mobile: hamburger menu koji se otvara kao overlay ili slide-in drawer
- Sav tekst na **hrvatskom** — "Početna", "Trgovina", "O nama", "Kontakt" itd.
- **Box Now** se ne spominje u navbaru niti u copy-u ako je stranica na engleskom — relevantno samo za hrvatsku verziju

### Page Structure (follow Havena layout logic)
1. **Hero** — full-width atmospheric image, large serif headline in Croatian, single CTA gumb
2. **Perks bar** — 3-4 ikone (besplatna dostava, originalni parfemi, sigurna kupnja, brza dostava)
3. **Bestselleri** — 4 proizvoda u gridu, ime + cijena, hover efekt
4. **Featured product** — split layout (slika lijevo, tekst desno) za Khamrah Dukhan kao hero proizvod
5. **Novi dolasci** — 3 proizvoda
6. **Kategorije** — Lattafa / Armaf / Bestselleri kao editorial tiles
7. **Social proof** — recenzije kupaca (kratki citati)
8. **Newsletter** — email input + "Prijavi se" CTA, copy o ekskluzivnim ponudama

### Copy Language
- Sav UI copy na **hrvatskom**
- Ton: tajan, senzualan, luxury — ne generički webshop
- Headline primjer: "Miris koji ostaje" / "Orijentalna parfumerija" / "Pronađi svoj potpis"
- Provjeri sve postojeće prijevode i ispravi eventualne greške ili miješanje jezika

### Responsive Design
- **Mobile-first** — dizajniraj za 360px širinu, skaliraj prema gore
- Breakpointi: mobile (default), md (768px), lg (1024px), xl (1280px)
- Grid na mobileu uvijek 1 ili 2 kolone, nikad 4
- Hero tekst čitljiv na malim ekranima — ne preklapaj s tamnim slikama bez overlay-a
- Navbar na mobileu: hamburger, touch-friendly tap targets (min 44px)
- Testiraj svaki section na 375px i 1280px

### CRITICAL — Newsletter Popup Preservation
- **NE DIRAJ** postojeći newsletter popup komponentu
- Popup se mora prikazivati pri prvom posjetu kao što je trenutno implementirano
- Ako redesign mijenja layout.tsx ili globals.css, provjeri da popup i dalje radi
- Popup z-index mora ostati iznad svih novih elemenata

### Technical
- Next.js App Router, Server Component gdje god moguće
- Tailwind CSS, koristi postojeće design tokene iz tailwind.config.js
- Mobile-first (majority of traffic is mobile)
- Product images: lazy load, next/image, 4:5 ratio
- No placeholder lorem ipsum — koristi stvarne nazive proizvoda iz baze
- Prije izmjena, pročitaj postojeće komponente da razumiješ trenutnu strukturu