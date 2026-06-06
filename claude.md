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