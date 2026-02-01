'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import styles from '@/styles/staticpage.module.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    // You can implement email sending here or just show a message
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
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
        <h1 className={styles.pageTitle}>CONTACT US</h1>
        
        <div className={styles.contactGrid}>
          <div className={styles.contactInfo}>
            <h2 className={styles.sectionTitle}>Get In Touch</h2>
            <p className={styles.bodyText}>
              Have a question about our products or need assistance with your order? We're here to help!
            </p>
            
            <div className={styles.contactDetails}>
              <div className={styles.contactItem}>
                <h3>Email</h3>
                <a href="mailto:pluteoinfo@gmail.com">pluteoinfo@gmail.com</a>
              </div>
        
            </div>
          </div>
          
          <div className={styles.contactForm}>
            <h2 className={styles.sectionTitle}>Send Us a Message</h2>
            
            {status === 'success' && (
              <div className={styles.successMessage}>
                Thank you for your message! We'll get back to you soon.
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="order">Order Inquiry</option>
                  <option value="product">Product Question</option>
                  <option value="shipping">Shipping & Delivery</option>
                  <option value="return">Returns & Exchanges</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  required
                />
              </div>
              
              <button
                type="submit"
                className={styles.submitButton}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}