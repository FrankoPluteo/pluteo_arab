import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { isFeatured: true },
    include: { brand: true },
    take: 4,
  });
  
  const bestSellers = await prisma.product.findMany({
    where: { isBestSeller: true },
    include: { brand: true },
    take: 4,
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Our Perfume Shop</h1>
        <p className="text-gray-600 mb-8">Discover your signature scent</p>
        <Link
          href="/products"
          className="inline-block bg-black text-white px-8 py-3 rounded hover:bg-gray-800 transition"
        >
          Shop All Products
        </Link>
      </section>
      
      {featuredProducts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
      
      {bestSellers.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Best Sellers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}