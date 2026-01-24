'use client';

import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/lib/store';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const finalPrice = product.price - product.discountAmount;
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-gray-100 mb-4 flex items-center justify-center">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400">No image</span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">{product.brand.name}</p>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.concentration} - {product.size}ml</p>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            {product.discountAmount > 0 && (
              <span className="text-sm text-gray-400 line-through">${product.price}</span>
            )}
            <span className="font-bold">${finalPrice}</span>
          </div>
        </div>
      </Link>
      
      <button
        onClick={(e) => {
          e.preventDefault();
          addItem(product);
        }}
        className="w-full mt-4 bg-black text-white py-2 rounded hover:bg-gray-800 transition"
      >
        Add to Cart
      </button>
    </div>
  );
}