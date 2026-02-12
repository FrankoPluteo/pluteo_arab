import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/staticpage.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

export const metadata: Metadata = {
  title: 'Legal Information — Pluteo | Shipping, Returns & Company Info',
  description: 'Shipping details, return policy, and company information for Pluteo. Operated by Vonta Grupa d.o.o. in Croatia. GLS shipping, 4.99 € flat rate.',
  alternates: {
    canonical: 'https://www.pluteo.shop/legal',
  },
  openGraph: {
    title: 'Legal Information — Pluteo',
    description: 'Shipping, returns, and company information for Pluteo perfume shop.',
    url: 'https://www.pluteo.shop/legal',
  },
};

export default function LegalPage() {
  return (
    <div>
      <Navbar />

      <div className={styles.pageContainer}>
        <div className={styles.logoContainer}>
          <Image src={logoIcon} alt="Pluteo" width={60} height={60} />
        </div>
        <h1 className={styles.pageTitle}>LEGAL INFORMATION</h1>

        <div className={styles.contentSection}>
          <p className={styles.leadText}>
            Shipping, returns, and company details for your peace of mind
          </p>

          <div className={styles.legalGrid}>
            <div className={styles.legalCard}>
              <h2 className={styles.sectionTitle}>Shipping</h2>
              <p className={styles.bodyText}>
                All orders are shipped via <strong>GLS</strong> courier service within Croatia. Shipping is a <strong>fixed price of 4.99 €</strong> per order, regardless of the number of items.
              </p>
              <p className={styles.bodyText}>
                Estimated delivery time is <strong>2–5 business days</strong> from the date of order confirmation. You will receive a tracking number via email once your order has been dispatched.
              </p>
            </div>

            <div className={styles.legalCard}>
              <h2 className={styles.sectionTitle}>Returns &amp; Refunds</h2>
              <p className={styles.bodyText}>
                If your package arrives <strong>damaged</strong>, you are entitled to return it for a <strong>full refund</strong>. Please contact us within 14 days of receiving your order with photos of the damaged item and packaging.
              </p>
              <p className={styles.bodyText}>
                To initiate a return, email us at{' '}
                <a href="mailto:pluteoinfo@gmail.com">pluteoinfo@gmail.com</a>{' '}
                with your order number and a description of the issue. We will provide return instructions and process your refund promptly.
              </p>
            </div>

            <div className={styles.legalCard}>
              <h2 className={styles.sectionTitle}>Company Information</h2>
              <p className={styles.bodyText}>
                This webshop is operated by:
              </p>
              <ul className={styles.featureList}>
                <li><strong>Company:</strong> Vonta Grupa d.o.o.</li>
                <li><strong>Location:</strong> Croatia</li>
                <li><strong>Email:</strong>{' '}
                  <a href="mailto:pluteoinfo@gmail.com">pluteoinfo@gmail.com</a>
                </li>
              </ul>
            </div>

            <div className={styles.legalCard}>
              <h2 className={styles.sectionTitle}>Contact</h2>
              <p className={styles.bodyText}>
                For any questions regarding your order, shipping, returns, or general inquiries, feel free to reach out to us:
              </p>
              <p className={styles.bodyText}>
                <strong>Email:</strong>{' '}
                <a href="mailto:pluteoinfo@gmail.com">pluteoinfo@gmail.com</a>
              </p>
              <p className={styles.bodyText}>
                You can also use our{' '}
                <Link href="/contact">contact form</Link>{' '}
                and we will get back to you within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
