import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import { prisma } from '@/lib/prisma';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import Footer from '@/components/Footer';
import { JesenTracker, AddToCartButton, CartLink, CartBar, NewsletterSignup } from './JesenClient';
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
        <p className={styles.eyebrow}>Jesenski izbor · {products.length} mirisa</p>
        <h1 className={styles.headline}>
          Jesen miriše <em>toplije.</em>
        </h1>
        <div className={styles.heroAside}>
          <p className={styles.subheadline}>Dim, začini, kava i vanilija. Za dane kad zahladi.</p>

          {promo && percentOff && (
            <div className={styles.promo}>
              <p className={styles.promoMain}>
                {percentOff}% popusta s kodom <span className={styles.promoCode}>{promo.code}</span>
              </p>
              <p className={styles.promoSub}>
                Kod je već u košarici, ne trebaš ga upisivati.
                {promo.endsAt && ` Vrijedi do ${formatDate(promo.endsAt)}`}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="mirisi" className={styles.chapters} aria-labelledby="mirisi-naslov">
        <h2 id="mirisi-naslov" className="sr-only">Četiri jesenska mirisa</h2>
        {cards.map(({ product, finalPrice, codePrice }, index) => {
          const soldOut = product.stock <= 0;
          const lowStock = product.stock > 0 && product.stock <= 3;
          const character = product.fragranceProfilesHr.join(' · ');
          const baseNotes = product.baseNotesHr.slice(0, 3).map((note) => note.trim().toLowerCase());
          const chapterNo = String(index + 1).padStart(2, '0');
          return (
            <article
              key={product.id}
              className={styles.chapter}
              aria-labelledby={`miris-${product.id}`}
            >
              <div className={styles.frame}>
                <p className={styles.frameMeta}>
                  <span className={styles.chapterNo}>{chapterNo}</span>
                  <span>{product.brand.name}</span>
                </p>
                <div className={styles.mount}>
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={`${product.brand.name} ${product.name}`}
                      fill
                      className={styles.productImg}
                      sizes="(max-width: 1023px) 64vw, 400px"
                      priority={index === 0}
                    />
                  )}
                </div>
                {soldOut && <span className={styles.badgeSoldOut}>Rasprodano</span>}
                {lowStock && <span className={styles.badgeLowStock}>Gotovo nestalo</span>}
              </div>

              <div className={styles.chapterBody}>
                <h3 id={`miris-${product.id}`} className={styles.chapterName}>
                  {product.name}
                </h3>
                {character && <p className={styles.character}>{character}</p>}
                {baseNotes.length > 0 && (
                  <p className={styles.notes}>U bazi: {baseNotes.join(', ')}</p>
                )}
                <p className={styles.details}>
                  {product.concentration} · {product.size} ml
                </p>

                <div className={styles.buy}>
                  <div className={styles.pricing}>
                    <p className={styles.priceRow}>
                      <span className={styles.price}>€{finalPrice.toFixed(2)}</span>
                      {product.discountAmount > 0 && (
                        <s className={styles.oldPrice}>€{product.price.toFixed(2)}</s>
                      )}
                    </p>
                    {codePrice !== null && promo && !soldOut && (
                      <p className={styles.codePrice}>
                        €{codePrice.toFixed(2)} s kodom {promo.code}
                      </p>
                    )}
                  </div>
                  <AddToCartButton
                    product={JSON.parse(JSON.stringify(product))}
                    value={codePrice ?? finalPrice}
                    soldOut={soldOut}
                  />
                  <Link href={`/products/${product.id}`} className={styles.detailsLink}>
                    Detalji mirisa
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className={styles.finalCta} aria-labelledby="odaberi-naslov">
        <h2 id="odaberi-naslov" className={styles.finalTitle}>
          Koji miris je <em>tvoj?</em>
        </h2>
        <div className={styles.finalAside}>
          {promo && percentOff && (
            <p className={styles.finalText}>
              Popust od {percentOff}% s kodom {promo.code} čeka te u košarici.
            </p>
          )}
          <ul className={styles.facts}>
            <li>Besplatna BOX NOW dostava od €{FREE_SHIPPING_THRESHOLD}</li>
            <li>Besplatni tester od 2 ml uz svaku narudžbu</li>
            <li>
              Originalni{' '}
              {brandNames.length > 1
                ? `${brandNames.slice(0, -1).join(', ')} i ${brandNames[brandNames.length - 1]}`
                : brandNames[0]}{' '}
              parfemi
            </li>
          </ul>
          <a href="#mirisi" className={styles.ctaButton}>
            Odaberi miris
          </a>
        </div>
      </section>

      <NewsletterSignup />

      <Footer />

      <CartBar />
    </div>
  );
}
