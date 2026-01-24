'use client';

import Link from 'next/link';
import { useCart } from '@/lib/store';

export default function Header() {
  const totalItems = useCart((state) => state.getTotalItems());
  
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Perfume Shop
        </Link>
        
        <nav className="flex gap-6 items-center">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/products" className="hover:underline">
            Products
          </Link>
          <Link href="/cart" className="hover:underline relative">
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}