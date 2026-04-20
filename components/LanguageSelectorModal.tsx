'use client';

import Image from 'next/image';
import { useLanguage } from '@/lib/languageContext';
import { Language } from '@/lib/translations';
import styles from '@/styles/languageselectormodal.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

interface Props {
  onComplete: () => void;
}

export default function LanguageSelectorModal({ onComplete }: Props) {
  const { setLanguage } = useLanguage();

  function choose(lang: Language) {
    setLanguage(lang);
    onComplete();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <Image src={logoIcon} alt="Pluteo" width={48} height={48} className={styles.logo} />

        <p className={styles.eyebrow}>WELCOME · DOBRODOŠLI</p>
        <h2 className={styles.heading}>Select your language</h2>
        <p className={styles.subtext}>Odaberite jezik</p>

        <div className={styles.options}>
          <button className={styles.optionBtn} onClick={() => choose('hr')}>
            <span className={styles.flag}>🇭🇷</span>
            <span className={styles.langName}>Hrvatski</span>
          </button>
          <button className={styles.optionBtn} onClick={() => choose('en')}>
            <span className={styles.flag}>🇬🇧</span>
            <span className={styles.langName}>English</span>
          </button>
        </div>
      </div>
    </div>
  );
}
