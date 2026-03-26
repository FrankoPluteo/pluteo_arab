'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ImageUpload from '@/components/ImageUpload';

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState<string | null>(null); // brand id currently saving
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((products: any[]) => {
        // Derive unique brands from the products list
        const seen = new Map<string, Brand>();
        for (const p of products) {
          if (p.brand && !seen.has(p.brand.id)) {
            seen.set(p.brand.id, {
              id: p.brand.id,
              name: p.brand.name,
              logoUrl: p.brand.logoUrl ?? null,
            });
          }
        }
        setBrands(Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name)));
      });
  }, []);

  async function saveLogo(brandId: string, logoUrl: string | null) {
    setSaving(brandId);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setBrands((prev) =>
        prev.map((b) => (b.id === brandId ? { ...b, logoUrl } : b))
      );
      setMessage('Logo updated successfully.');
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '120px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Brand Logos</h1>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
          Upload a logo to Cloudinary for each brand. Logos are shown on product cards and detail pages.
          Clear a logo to remove a broken URL (it will silently hide the logo instead of 404-ing).
        </p>

        {message && (
          <p style={{ padding: '10px 14px', background: message.startsWith('Error') ? '#fce8e8' : '#e8f5e9', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
            {message}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {brands.map((brand) => {
            const isCloudinary = brand.logoUrl?.startsWith('https://res.cloudinary.com');
            const isBroken = brand.logoUrl && !isCloudinary;

            return (
              <div
                key={brand.id}
                style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}
              >
                {/* Logo preview */}
                <div style={{ width: '80px', height: '80px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {isCloudinary ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={brand.logoUrl!} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '4px' }}>
                      {isBroken ? '⚠ broken' : 'no logo'}
                    </span>
                  )}
                </div>

                {/* Brand info */}
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <p style={{ fontWeight: 700, marginBottom: '4px' }}>{brand.name}</p>
                  {brand.logoUrl ? (
                    <p style={{ fontSize: '12px', color: isBroken ? '#c62828' : '#388e3c', wordBreak: 'break-all' }}>
                      {isBroken ? `⚠ Non-Cloudinary URL (will 404): ${brand.logoUrl}` : brand.logoUrl}
                    </p>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#999' }}>No logo set</p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                  <ImageUpload
                    folder="brands"
                    onUpload={(url) => saveLogo(brand.id, url)}
                  />
                  {brand.logoUrl && (
                    <button
                      onClick={() => saveLogo(brand.id, null)}
                      disabled={saving === brand.id}
                      style={{ padding: '8px 14px', background: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      {saving === brand.id ? 'Saving…' : 'Clear logo'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
