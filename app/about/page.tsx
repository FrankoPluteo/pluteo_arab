import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/staticpage.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

export const metadata: Metadata = {
  title: 'About Pluteo — Authentic Arabian & Oud Perfumes in Croatia',
  description: 'Pluteo is Croatia\'s destination for authentic Arabian perfumes and oud fragrances. We offer 100% original Lattafa, Armaf & French Avenue perfumes with fast shipping across Croatia.',
  keywords: 'about pluteo, arabian perfume shop croatia, authentic oud perfumes, lattafa armaf croatia, luxury perfume store, oriental fragrances croatia',
  alternates: {
    canonical: 'https://www.pluteo.shop/about',
  },
  openGraph: {
    title: 'About Pluteo — Your Arabian Perfume Destination in Croatia',
    description: 'Discover why Pluteo is Croatia\'s trusted source for authentic Arabian perfumes, oud fragrances, and long-lasting luxury scents.',
    url: 'https://www.pluteo.shop/about',
  },
};

export default function AboutPage() {
  // JSON-LD Organization structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pluteo',
    url: 'https://www.pluteo.shop',
    logo: 'https://www.pluteo.shop/Pluteo Logo Icon.svg',
    description: 'Croatia\'s destination for authentic Arabian perfumes and oud fragrances from Lattafa, Armaf, and French Avenue.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'pluteoinfo@gmail.com',
      contactType: 'customer service',
      areaServed: 'HR',
      availableLanguage: ['English', 'Croatian'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Croatia',
    },
  };

  return (
    <div>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={styles.pageContainer}>
        <div className={styles.logoContainer}>
          <Image src={logoIcon} alt="Pluteo — Arabian Perfumes Croatia" width={60} height={60} />
        </div>
        <h1 className={styles.pageTitle}>ABOUT PLUTEO</h1>

        <div className={styles.contentSection}>
          <p className={styles.leadText}>
            Welcome to Pluteo — your premium destination for authentic Arabian perfumes and luxury oud fragrances in Croatia.
          </p>

          <h2 className={styles.sectionTitle}>Our Story</h2>
          <p className={styles.bodyText}>
We are a curated online perfume store focused on modern Arabic perfumery, offering carefully selected Arabian fragrances defined by character, expression, and effortless elegance. Our selection reflects a contemporary approach to oriental perfumery, combined with a refined style that remains confident, rich, and seductive.

We believe scent is a form of identity. Our mission is to help you discover long-lasting perfumes that feel personal, expressive, and irresistible. Every oud fragrance and Arabian perfume in our collection is chosen with intention, quality, and character in mind — from bold woody compositions to delicate floral orientals.
          </p>

          <h2 className={styles.sectionTitle}>What Are Arabian Perfumes?</h2>
          <p className={styles.bodyText}>
We specialize in Arabian perfumes and oud fragrances — scents renowned worldwide for their exceptional richness, longevity, and depth. Unlike many mass-market fragrances, Arabic perfumes emphasize warm oud woods, precious resins, exotic spices, amber, musk, vanilla, and expressive florals, creating compositions that evolve beautifully on the skin and last throughout the day.

Our curated selection from <Link href="/products?brand=Lattafa">Lattafa</Link>, <Link href="/products?brand=Armaf">Armaf</Link>, and <Link href="/products?brand=French Avenue">French Avenue</Link> includes modern interpretations as well as classic-inspired creations, designed for both everyday wear and special occasions. These luxury perfumes are not about fleeting impressions — they are about presence, emotion, and lasting character.
          </p>

          <h2 className={styles.sectionTitle}>100% Authentic — Quality Guarantee</h2>
          <p className={styles.bodyText}>
We guarantee that every Arabian perfume and oud fragrance we offer is 100% original and authentic, sourced from trusted distributors and verified suppliers. Quality and transparency are at the core of our business — from the fragrance itself to packaging and storage.

Each perfume is handled with care and shipped securely across Croatia to ensure it arrives in perfect condition. When you shop with Pluteo, you can trust that you are receiving genuine luxury fragrances that meet the highest standards of craftsmanship and performance.
          </p>

          <h2 className={styles.sectionTitle}>Why Choose Pluteo?</h2>
          <ul className={styles.featureList}>
            <li>&#10003; 100% Authentic Arabian Perfumes &amp; Oud Fragrances</li>
            <li>&#10003; Competitive Prices on Luxury Fragrances</li>
            <li>&#10003; Fast &amp; Secure Shipping Across Croatia</li>
            <li>&#10003; Expert Customer Service &amp; Fragrance Advice</li>
            <li>&#10003; Carefully Curated Collection — Lattafa, Armaf &amp; French Avenue</li>
            <li>&#10003; Easy Returns &amp; Exchanges</li>
          </ul>

          <p className={styles.bodyText}>
Ready to discover your signature scent? <Link href="/products">Browse our full collection of Arabian perfumes</Link> and find the luxury fragrance that speaks to you.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
