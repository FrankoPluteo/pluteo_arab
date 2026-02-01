import Navbar from '@/components/Navbar';
import styles from '@/styles/staticpage.module.css';

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
            Welcome to Pluteo, your premium destination for authentic Arabian fragrances and designer perfumes.
          </p>
          
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <p className={styles.bodyText}>
            Founded with a passion for exceptional scents, Pluteo brings you a carefully curated collection of the finest perfumes from around the world. We specialize in authentic Arabian fragrances from renowned brands like Lattafa and Armaf, alongside exclusive designer collections.
          </p>
          
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <p className={styles.bodyText}>
            We believe that fragrance is more than just a scent – it's an expression of personality, a memory maker, and a confidence booster. Our mission is to make premium perfumes accessible to everyone who appreciates quality and authenticity.
          </p>
          
          <h2 className={styles.sectionTitle}>Quality Guarantee</h2>
          <p className={styles.bodyText}>
            Every perfume in our collection is 100% authentic and sourced directly from authorized distributors. We stand behind the quality of our products and offer a satisfaction guarantee on all purchases.
          </p>
          
          <h2 className={styles.sectionTitle}>Why Choose Pluteo?</h2>
          <ul className={styles.featureList}>
            <li>✓ 100% Authentic Products</li>
            <li>✓ Competitive Prices</li>
            <li>✓ Fast & Secure Shipping</li>
            <li>✓ Expert Customer Service</li>
            <li>✓ Carefully Curated Collection</li>
            <li>✓ Easy Returns & Exchanges</li>
          </ul>
        </div>
      </div>
    </div>
  );
}