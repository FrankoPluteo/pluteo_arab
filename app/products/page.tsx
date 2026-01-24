import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { brand: true },
    orderBy: { createdAt: 'desc' },
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}