import Navbar from '@/components/Navbar';
import styles from '@/styles/staticpage.module.css';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About Us - Pluteo',
  description: 'Learn about Pluteo - your destination for premium Arabian and designer perfumes.',
};

export default function AboutPage() {
  return (
    <div>
      <Navbar />
      
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>ABOUT PLUTEO</h1>
        
        <div className={styles.contentSection}>
          <p className={styles.leadText}>
            Welcome to Pluteo, your premium destination for authentic Arabian fragrances.
          </p>
          
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <p className={styles.bodyText}>
We are a curated online store focused on modern Arabic perfumery, offering carefully selected fragrances defined by character, expression, and effortless elegance. Our selection reflects a contemporary approach, combined with a refined style that remains confident, rich, and seductive. 

We believe scent is a form of identity, and our mission is to help you discover perfumes that feel personal, expressive, and irresistible. Every fragrance in our collection is chosen with intention, quality, and character in mind.           </p>
          
          <h2 className={styles.sectionTitle}>What do we offer?</h2>
          <p className={styles.bodyText}>
We specialize in Arabic perfumes, fragrances known for their richness, longevity, and depth. Unlike many mass-market scents, Arabic perfumes often emphasize warm woods, resins, spices, amber, musk, vanilla, and expressive florals, creating compositions that evolve beautifully on the skin. 

Our selection includes modern interpretations as well as classic-inspired creations, designed for both everyday wear and special occasions. These perfumes are not about fleeting impressions, but about presence, emotion, and lasting character.           </p>
          
          <h2 className={styles.sectionTitle}>Quality Guarantee</h2>
          <p className={styles.bodyText}>
We guarantee that every product we offer is 100% original and authentic, sourced from trusted distributors and verified suppliers. Quality and transparency are at the core of our business, from the fragrance itself to packaging and storage. 

Each perfume is handled with care and shipped securely to ensure it arrives in perfect condition. When you shop with us, you can trust that you are receiving genuine fragrances that meet high standards of craftsmanship and performance.           </p>
          
          <h2 className={styles.sectionTitle}>Why Choose Pluteo?</h2>
          <ul className={styles.featureList}>
            <li>✓ 100% Authentic Products</li>
            <li>✓ Competitive Prices</li>
            <li>✓ Fast & Secure Shipping</li>
            <li>✓ Expert Customer Service</li>
            <li>✓ Carefully Curated Collection</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}