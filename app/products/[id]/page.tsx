'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/lib/store';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCart((state) => state.addItem);
  
  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      });
  }, [params.id]);
  
  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (!product) return <div className="container mx-auto px-4 py-8">Product not found</div>;
  
  const finalPrice = product.price - product.discountAmount;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-gray-100 mb-4 flex items-center justify-center">
            {product.images[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">No image</span>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500">{product.brand.name}</p>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600">{product.concentration} - {product.size}ml</p>
          </div>
          
          <div className="flex items-baseline gap-3">
            {product.discountAmount > 0 && (
              <span className="text-xl text-gray-400 line-through">${product.price}</span>
            )}
            <span className="text-3xl font-bold">${finalPrice}</span>
            {product.discountAmount > 0 && (
              <span className="text-green-600">Save ${product.discountAmount}</span>
            )}
          </div>
          
          <button
            onClick={() => addItem(product)}
            className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition"
          >
            Add to Cart
          </button>
          
          <div>
            <h2 className="font-bold mb-2">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Top Notes</h3>
              <p className="text-gray-700">{product.topNotes.join(', ')}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Heart Notes</h3>
              <p className="text-gray-700">{product.heartNotes.join(', ')}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Base Notes</h3>
              <p className="text-gray-700">{product.baseNotes.join(', ')}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">Gender: {product.gender}</p>
            <p className="text-sm text-gray-600">In Stock: {product.stock} units</p>
          </div>
        </div>
      </div>
    </div>
  );
}