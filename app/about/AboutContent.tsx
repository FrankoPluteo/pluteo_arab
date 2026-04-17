'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/staticpage.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

export default function AboutContent() {
  const { t } = useLanguage();

  // Split multi-paragraph body strings on the double-newline delimiter
  const storyParagraphs = t.about.ourStoryBody.split('\n\n');
  const whatAreParagraphs = t.about.whatAreBody.split('\n\n');
  const authenticParagraphs = t.about.authenticBody.split('\n\n');

  return (
    <div>
      <Navbar />

      <div className={styles.pageContainer}>
        <div className={styles.logoContainer}>
          <Image src={logoIcon} alt="Pluteo — Arabian Perfumes Croatia" width={60} height={60} />
        </div>
        <h1 className={styles.pageTitle}>{t.about.title}</h1>

        <div className={styles.contentSection}>
          <p className={styles.leadText}>{t.about.leadText}</p>

          <h2 className={styles.sectionTitle}>{t.about.ourStoryTitle}</h2>
          {storyParagraphs.map((p, i) => (
            <p key={i} className={styles.bodyText}>{p}</p>
          ))}

          <h2 className={styles.sectionTitle}>{t.about.whatAreTitle}</h2>
          {whatAreParagraphs.map((p, i) => (
            <p key={i} className={styles.bodyText}>{p}</p>
          ))}

          <h2 className={styles.sectionTitle}>{t.about.authenticTitle}</h2>
          {authenticParagraphs.map((p, i) => (
            <p key={i} className={styles.bodyText}>{p}</p>
          ))}

          <h2 className={styles.sectionTitle}>{t.about.whyChooseTitle}</h2>
          <ul className={styles.featureList}>
            {t.about.whyChooseItems.map((item, i) => (
              <li key={i}>&#10003; {item}</li>
            ))}
          </ul>

          <p className={styles.bodyText}>
            {t.about.readyToDiscover}{' '}
            <Link href="/products">{t.about.browseCollection}</Link>{' '}
            {t.about.ctaSuffix}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
