import Link from 'next/link';
import Navbar from '@/components/Navbar';
import s from '@/styles/admin.module.css';

const SECTIONS = [
  {
    href: '/admin/products',
    title: 'Stock & Price',
    description: 'Update how much a product costs and how many units are available to sell.',
  },
  {
    href: '/admin/products/add',
    title: 'Add Product',
    description: 'Create a new product listing with images, notes, and pricing.',
  },
  {
    href: '/admin/brands',
    title: 'Brands',
    description: 'Edit brand logos, descriptions, and website links.',
  },
  {
    href: '/admin/affiliates',
    title: 'Affiliates',
    description: 'Review and manage affiliate accounts and payouts.',
  },
];

export default function AdminDashboardPage() {
  return (
    <>
      <Navbar />
      <div className={s.page} style={{ marginTop: '100px' }}>
        <div className={s.header}>
          <h1 className={s.title}>ADMIN</h1>
          <p className={s.subtitle}>Choose what you would like to manage.</p>
        </div>

        <div className={s.dashboardGrid}>
          {SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} className={s.dashboardCard}>
              <div className={s.dashboardCardTitle}>{section.title}</div>
              <div className={s.dashboardCardDesc}>{section.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
