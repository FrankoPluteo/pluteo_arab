'use client';

import { useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/staticpage.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      <Navbar />

      <div className={styles.pageContainer}>
        <div className={styles.logoContainer}>
          <Image src={logoIcon} alt="Pluteo" width={60} height={60} />
        </div>
        <h1 className={styles.pageTitle}>{t.contact.title}</h1>

        <div className={styles.contactGrid}>
          <div className={styles.contactInfo}>
            <h2 className={styles.sectionTitle}>{t.contact.getInTouch}</h2>
            <p className={styles.bodyText}>{t.contact.haveAQuestion}</p>

            <div className={styles.contactDetails}>
              <div className={styles.contactItem}>
                <h3>{t.contact.email}</h3>
                <a href="mailto:pluteoinfo@gmail.com">pluteoinfo@gmail.com</a>
              </div>

              <div className={styles.contactItem}>
                <h3>{t.contact.shipping}</h3>
                <p>{t.contact.shipsWithin}</p>
                <p>{t.contact.deliveryTime}</p>
                <p><Link href="/legal">{t.contact.viewShippingPolicy}</Link></p>
              </div>

            </div>
          </div>

          <div className={styles.contactForm}>
            <h2 className={styles.sectionTitle}>{t.contact.sendMessage}</h2>

            {status === 'success' && (
              <div className={styles.successMessage}>{t.contact.successMessage}</div>
            )}

            {status === 'error' && (
              <div className={styles.errorMessage}>{t.contact.errorMessage}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">{t.contact.name} *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={status === 'sending'}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">{t.contact.emailLabel} *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={status === 'sending'}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject">{t.contact.subject} *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={status === 'sending'}
                >
                  <option value="">{t.contact.selectSubject}</option>
                  <option value="order">{t.contact.orderInquiry}</option>
                  <option value="product">{t.contact.productQuestion}</option>
                  <option value="shipping">{t.contact.shippingDelivery}</option>
                  <option value="return">{t.contact.returnsExchanges}</option>
                  <option value="other">{t.contact.other}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message">{t.contact.message} *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  required
                  disabled={status === 'sending'}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? t.contact.sending : t.contact.send}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
