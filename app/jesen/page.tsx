import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import { prisma } from '@/lib/prisma';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import { JesenTracker, AddToCartButton, CartLink, CartBar } from './JesenClient';
import styles from '@/styles/jesen.module.css';

export const revalidate = 60;

const BASE_URL = 'https://www.pluteo.shop';
const PAGE_URL = `${BASE_URL}/jesen`;
const PROMO_CODE = 'JESEN15';

// Shown in exactly this order. Names, prices and images all come from the database.
const CAMPAIGN_PRODUCT_IDS = [
  'cmkzkzebl000ehrmup3vkxbnp',
  'cmkzkzesz000ohrmuo470jaw8',
  'cmprodvintageradio001',
  'cmttzifyi0001o6jy8z4euyah',
];

export const viewport: Viewport = {
  themeColor: '#230007',
};

const getCampaignData = cache(async () => {
  const [products, promo] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: CAMPAIGN_PRODUCT_IDS } },
      include: { brand: true },
    }),
    prisma.promoCode.findUnique({ where: { code: PROMO_CODE } }),
  ]);

  const sortedProducts = CAMPAIGN_PRODUCT_IDS.map((id) => products.find((p) => p.id === id)).filter(
    (p): p is (typeof products)[number] => Boolean(p)
  );
  if (sortedProducts.length !== CAMPAIGN_PRODUCT_IDS.length) {
    console.error('[jesen] campaign products missing from database', {
      missing: CAMPAIGN_PRODUCT_IDS.filter((id) => !products.some((p) => p.id === id)),
    });
  }

  // Same checks /api/promo runs, so the page never advertises a code the cart would reject.
  const now = new Date();
  const promoActive = Boolean(
    promo &&
      promo.isActive &&
      (!promo.startsAt || promo.startsAt <= now) &&
      (!promo.endsAt || promo.endsAt > now) &&
      (promo.usageLimitTotal === null || promo.timesUsed < promo.usageLimitTotal)
  );
  const percentOff = promoActive && promo?.discountType === 'percent' ? promo.discountValue : null;

  return { products: sortedProducts, promo: promoActive ? promo : null, percentOff };
});

function formatDate(date: Date): string {
  return date.toLocaleDateString('hr-HR', {
    timeZone: 'Europe/Zagreb',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const { products, percentOff } = await getCampaignData();
  const names = products.map((p) => p.name);
  const nameList =
    names.length > 1 ? `${names.slice(0, -1).join(', ')} i ${names[names.length - 1]}` : names[0] ?? '';

  const title = percentOff ? `Jesenski mirisi uz ${percentOff}% popusta` : 'Jesenski mirisi';
  const description = percentOff
    ? `${nameList}. Topli arapski parfemi za jesen, uz ${percentOff}% popusta s kodom ${PROMO_CODE}.`
    : `${nameList}. Topli arapski parfemi za jesen uz brzu dostavu diljem Hrvatske.`;
  const image = products[0]?.images[0];

  return {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: `${title} | Pluteo`,
      description,
      url: PAGE_URL,
      siteName: 'Pluteo',
      // Without a product image, the site-wide app/opengraph-image is used
      ...(image && { images: [{ url: image, width: 800, height: 800, alt: `${products[0].brand.name} ${products[0].name}` }] }),
      locale: 'hr_HR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Pluteo`,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function JesenPage() {
  const { products, promo, percentOff } = await getCampaignData();
  const brandNames = [...new Set(products.map((p) => p.brand.name))];

  const cards = products.map((product) => {
    const finalPrice = product.price - product.discountAmount;
    const codePrice = percentOff ? Math.round(finalPrice * (100 - percentOff)) / 100 : null;
    return { product, finalPrice, codePrice };
  });

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jesenski mirisi',
    url: PAGE_URL,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}/products/${product.id}`,
      name: `${product.brand.name} ${product.name}`,
    })),
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <JesenTracker
        defaultCode={promo ? promo.code : null}
        contentIds={products.map((p) => p.id)}
      />

      <header className={styles.header}>
        <Link href="/" className={styles.logoLink} aria-label="Pluteo početna">
          <Image
            src="/Pluteo Logo Long.svg"
            alt="Pluteo"
            width={70}
            height={44}
            className={styles.logoImg}
            priority
          />
        </Link>
        <CartLink />
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Jesenski izbor</p>
        <h1 className={styles.headline}>Jesen miriše toplije</h1>
        <p className={styles.subheadline}>Dim, začini i vanilija. Četiri mirisa za hladnije dane.</p>

        {promo && percentOff && (
          <div className={styles.promo}>
            <p className={styles.promoMain}>
              {percentOff}% popusta s kodom <span className={styles.promoCode}>{promo.code}</span>
            </p>
            <p className={styles.promoSub}>
              Kod je već dodan u košaricu, ne trebaš ga upisivati.
              {promo.endsAt && ` Vrijedi do ${formatDate(promo.endsAt)}`}
            </p>
          </div>
        )}
      </section>

      <section id="mirisi" className={styles.productsSection} aria-labelledby="mirisi-naslov">
        <h2 id="mirisi-naslov" className="sr-only">Četiri jesenska mirisa</h2>
        <div className={styles.productsGrid}>
          {cards.map(({ product, finalPrice, codePrice }, index) => {
            const soldOut = product.stock <= 0;
            const lowStock = product.stock > 0 && product.stock <= 3;
            return (
              <article key={product.id} className={styles.card}>
                <div className={styles.imageWrap}>
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={`${product.brand.name} ${product.name}`}
                      fill
                      className={styles.productImg}
                      sizes="(max-width: 767px) 46vw, 260px"
                      priority={index < 2}
                    />
                  )}
                  {soldOut && <span className={styles.badgeSoldOut}>Rasprodano</span>}
                  {lowStock && <span className={styles.badgeLowStock}>Gotovo nestalo</span>}
                </div>

                <div className={styles.cardInfo}>
                  <p className={styles.cardBrand}>{product.brand.name}</p>
                  <h3 className={styles.cardName}>{product.name}</h3>
                  <p className={styles.cardDetails}>
                    {product.concentration} · {product.size} ml
                  </p>

                  <div className={styles.cardPricing}>
                    <p className={styles.priceRow}>
                      {product.discountAmount > 0 && (
                        <span className={styles.oldPrice}>€{product.price.toFixed(2)}</span>
                      )}
                      <span className={styles.price}>€{finalPrice.toFixed(2)}</span>
                    </p>
                    {codePrice !== null && promo && !soldOut && (
                      <p className={styles.codePrice}>
                        €{codePrice.toFixed(2)} s {promo.code}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <AddToCartButton
                    product={JSON.parse(JSON.stringify(product))}
                    value={codePrice ?? finalPrice}
                    soldOut={soldOut}
                  />
                  <Link href={`/products/${product.id}`} className={styles.detailsLink}>
                    Detalji mirisa
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.valueSection} aria-labelledby="zasto-naslov">
        <h2 id="zasto-naslov" className={styles.sectionTitle}>
          Zašto baš ova četiri
        </h2>
        <ul className={styles.valueList}>
          <li className={styles.valueItem}>
            <h3 className={styles.valueTitle}>Topli akordi</h3>
            <p className={styles.valueText}>
              Duhan, tamjan, kava, vanilija i začini. Note koje griju kad zahladi.
            </p>
          </li>
          <li className={styles.valueItem}>
            <h3 className={styles.valueTitle}>Originalni parfemi</h3>
            <p className={styles.valueText}>
              {brandNames.length > 1
                ? `${brandNames.slice(0, -1).join(', ')} i ${brandNames[brandNames.length - 1]}`
                : brandNames[0]}
              , 100% originalni. Dugotrajni mirisi koji se razvijaju na koži kroz cijeli dan.
            </p>
          </li>
          <li className={styles.valueItem}>
            <h3 className={styles.valueTitle}>Dostava i tester</h3>
            <p className={styles.valueText}>
              Besplatna BOX NOW dostava od €{FREE_SHIPPING_THRESHOLD}, a uz svaku narudžbu biraš
              besplatni tester od 2 ml.
            </p>
          </li>
        </ul>
      </section>

      <section className={styles.finalCta}>
        <h2 className={styles.sectionTitle}>Odaberi svoj jesenski miris</h2>
        {promo && percentOff && (
          <p className={styles.finalText}>
            Popust od {percentOff}% s kodom {promo.code} čeka te u košarici.
          </p>
        )}
        <a href="#mirisi" className={styles.ctaButton}>
          Pogledaj mirise
        </a>
      </section>

      <footer className={styles.legal}>
        <p>
          © Pluteo · <Link href="/legal">Uvjeti</Link> · <Link href="/contact">Kontakt</Link> ·{' '}
          <Link href="/about">O nama</Link>
        </p>
      </footer>

      <CartBar />
    </div>
  );
}
