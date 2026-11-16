import type { Metadata } from 'next';
import { prisma, withReviewAggregates } from '@/lib/prisma';
import { SHOP_ORDER } from '@/lib/productOrder';
import PoklonContent from './PoklonContent';

export const revalidate = 60;

const BASE_URL = 'https://www.pluteo.shop';

// Each gift page lists the products with its flag ticked in the admin (Stock & Price → Gift page).
const RECIPIENTS = {
  'za-nju': {
    recipient: 'her',
    flag: 'isGiftWomen',
    title: 'Poklon za nju - arapski parfemi',
    description:
      'Odabrani arapski parfemi kao poklon za nju. Originalni Lattafa, Armaf i French Avenue mirisi uz brzu dostavu diljem Hrvatske.',
  },
  'za-njega': {
    recipient: 'him',
    flag: 'isGiftMen',
    title: 'Poklon za njega - arapski parfemi',
    description:
      'Odabrani arapski parfemi kao poklon za njega. Originalni Lattafa, Armaf i French Avenue mirisi uz brzu dostavu diljem Hrvatske.',
  },
} as const;

type Slug = keyof typeof RECIPIENTS;

export function generateStaticParams() {
  return Object.keys(RECIPIENTS).map((recipient) => ({ recipient }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ recipient: string }>;
}): Promise<Metadata> {
  const { recipient } = await params;
  const page = RECIPIENTS[recipient as Slug];
  const url = `${BASE_URL}/poklon/${recipient}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url },
  };
}

export default async function PoklonPage({
  params,
}: {
  params: Promise<{ recipient: string }>;
}) {
  const { recipient } = await params;
  const page = RECIPIENTS[recipient as Slug];

  const raw = await prisma.product.findMany({
    where: page.flag === 'isGiftWomen' ? { isGiftWomen: true } : { isGiftMen: true },
    include: { brand: true },
    orderBy: SHOP_ORDER,
  });

  // Sold-out gifts stay listed, but after everything that can be bought today.
  const products = (await withReviewAggregates(raw)).sort(
    (a, b) => Number(b.stock > 0) - Number(a.stock > 0)
  );

  return <PoklonContent recipient={page.recipient} products={products} />;
}
