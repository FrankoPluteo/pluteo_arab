import Link from 'next/link';
import { prisma, withReviewAggregates } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import styles from '@/styles/home.module.css';
import logolong from '../public/Pluteo Logo Long.svg';
import lattafaimg from '../public/lattafa.jpg';
import frenchavenueimg from '../public/frenchavenue.jpg';
import armafimg from '../public/armaf.jpg';
import wallapaperhome from '../public/wallpaperhome.jpg';
import ValentineSection from '@/components/ValentineSection';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pluteo',
    url: 'https://www.pluteo.shop',
    description: 'Premium Arabian perfumes and oud fragrances shipped across Croatia. Authentic Lattafa, Armaf, and French Avenue luxury fragrances.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.pluteo.shop/products?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function HomePage() {
  const featuredProducts = await withReviewAggregates(
    await prisma.product.findMany({
      where: { isFeatured: true },
      include: { brand: true },
      take: 4,
    })
  );

  const bestSellers = await withReviewAggregates(
    await prisma.product.findMany({
      where: { isBestSeller: true },
      include: { brand: true },
      take: 4,
    })
  );

  return (
    <div>
      <Navbar />
      <HomeJsonLd />

      <div className={styles.homeBackground}>
        <img className={styles.wallpaperhome} src={wallapaperhome.src} alt="Premium Arabian perfumes and oud fragrances — Pluteo Croatia" />
        <div className={styles.promoTrack}>
          <span>IN SYNC — Valentine&apos;s Duo Packs — Save &euro;10</span>
        </div>
        <h1 className="sr-only">Pluteo — Premium Arabian Perfumes &amp; Oud Fragrances in Croatia</h1>
        <img className={styles.logolongimg} src={logolong.src} alt="Pluteo — Arabian Perfume Shop Croatia" />
        <Link href="/products" className={styles.goToShop}>SHOP</Link>

        <div className={styles.taglines}>
          <span className={styles.tagline}>LONG LASTING</span>
          <span className={styles.taglineDot}>&middot;</span>
          <span className={styles.tagline}>LUXURY</span>
          <span className={styles.taglineDot}>&middot;</span>
          <span className={styles.tagline}>RICH</span>
        </div>

        <div className={styles.filterLinkBox}>
          <Link href="/products?gender=male" className={styles.filterLink}>
            MEN&apos;S PERFUMES
          </Link>
          <Link href="/products?gender=female" className={styles.filterLink}>
            WOMEN&apos;S PERFUMES
          </Link>
        </div>
      </div>

      <ValentineSection />

      <div className={styles.home2}>
        <div className={styles.brandBox}>
          <img className={styles.brandimage} src={lattafaimg.src} alt="Lattafa perfumes — luxury Arabian fragrances" />
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=Lattafa" className={styles.brandLink}>
            LATTAFA
          </Link>
        </div>

        <div className={styles.brandBox}>
          <div className={styles.categoryOverlay} />
          <img className={styles.brandimage} src={armafimg.src} alt="Armaf perfumes — premium oriental fragrances" />
          <Link href="/products?brand=Armaf" className={styles.brandLink}>
            ARMAF
          </Link>
        </div>

        <div className={styles.brandBox}>
          <div className={styles.categoryOverlay} />
          <img className={styles.brandimage} src={frenchavenueimg.src} alt="French Avenue perfumes — modern luxury scents" />
          <Link href="/products?brand=French Avenue" className={styles.brandLink}>
            FRENCH AVENUE
          </Link>
        </div>
      </div>

      {featuredProducts.length > 0 && (
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>FEATURED PERFUMES</h2>
          <div className={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {bestSellers.length > 0 && (
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>BEST-SELLING LUXURY FRAGRANCES</h2>
          <div className={styles.productsGrid}>
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
