import Link from 'next/link';
import { prisma, withReviewAggregates } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import styles from '@/styles/home.module.css';
import logolong from '../public/Pluteo Logo Long.svg';
import lattafaimg from '../public/lattafa.webp';
import frenchavenueimg from '../public/frenchavenue.webp';
import armafimg from '../public/armaf.webp';
import wallpaperhome from '../public/wallpaperhome.webp';
import Footer from '@/components/Footer';
import Image from "next/image";
import boxnowpromophoto from '../public/BOX-NOW_Badge_Besplatna_dostava_Simple_Golden2.png';

export const revalidate = 60;

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
  const [rawFeatured, rawBestSellers] = await Promise.all([
    prisma.product.findMany({
      where: { isFeatured: true },
      include: { brand: true },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isBestSeller: true },
      include: { brand: true },
      take: 4,
    }),
  ]);

  const [featuredProducts, bestSellers] = await Promise.all([
    withReviewAggregates(rawFeatured),
    withReviewAggregates(rawBestSellers),
  ]);

  return (
    <div>
      <HomeJsonLd />

      {/* Hero — full width, full viewport height */}
      <div className={styles.homeBackground}>
        <Image
          fill
          src={wallpaperhome}
          alt="Premium Arabian perfumes and oud fragrances — Pluteo Croatia"
          priority
          quality={65}
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          className={styles.wallpaperhome}
        />
        <h1 className="sr-only">Pluteo — Premium Arabian Perfumes &amp; Oud Fragrances in Croatia</h1>
        <Image
          className={styles.logolongimg}
          src={logolong}
          alt="Pluteo — Arabian Perfume Shop Croatia"
          width={493}
          height={310}
          priority
        />
        <Link href="/products" className={styles.goToShop}>SHOP</Link>

        <div className={styles.taglines}>
          <span className={styles.tagline}>LASTING</span>
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

      {/* Featured — "For Those Who Want to Stand Out" */}
      {featuredProducts.length > 0 && (
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>FOR THOSE WHO WANT TO STAND OUT</h2>
          <div className={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Brand Section — full width, 3 touching panels */}
      <div className={styles.brandSection}>
        <div className={styles.brandBox}>
          <Image
            fill
            src={lattafaimg}
            alt="Lattafa perfumes — luxury Arabian fragrances"
            style={{ objectFit: 'cover', filter: 'brightness(0.5)' }}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=Lattafa" className={styles.brandLink}>LATTAFA</Link>
        </div>

        <div className={styles.brandBox}>
          <Image
            fill
            src={armafimg}
            alt="Armaf perfumes — premium oriental fragrances"
            style={{ objectFit: 'cover', filter: 'brightness(0.5)' }}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=Armaf" className={styles.brandLink}>ARMAF</Link>
        </div>

        <div className={styles.brandBox}>
          <Image
            fill
            src={frenchavenueimg}
            alt="French Avenue perfumes — modern luxury scents"
            style={{ objectFit: 'cover', filter: 'brightness(0.5)' }}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=French Avenue" className={styles.brandLink}>FRENCH AVENUE</Link>
        </div>
      </div>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>BEST-SELLING FRAGRANCES</h2>
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
