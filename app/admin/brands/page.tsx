'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ImageUpload from '@/components/ImageUpload';

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
}

function LogoPreview({ url, name }: { url: string; name: string }) {
  const [broken, setBroken] = useState(false);

  // Reset broken state when the URL changes (new logo saved)
  useEffect(() => setBroken(false), [url]);

  if (broken) {
    return (
      <span style={{ fontSize: '12px', color: '#c62828', textAlign: 'center', padding: '4px' }}>
        ⚠ 404
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      onError={() => setBroken(true)}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((products: any[]) => {
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
      setUrlInputs((prev) => ({ ...prev, [brandId]: '' }));
      setMessage('Logo updated.');
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '860px', margin: '120px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Brand Logos</h1>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
          Paste any public image URL (SVG, PNG, WebP…) or upload via Cloudinary.
          If a logo shows <strong>⚠ 404</strong> in the preview, the URL is broken — clear it
          and set a working replacement.
        </p>

        {message && (
          <p style={{ padding: '10px 14px', background: message.startsWith('Error') ? '#fce8e8' : '#e8f5e9', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
            {message}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {brands.map((brand) => (
            <div
              key={brand.id}
              style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {/* Logo preview */}
                <div style={{ width: '72px', height: '72px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {brand.logoUrl ? (
                    <LogoPreview url={brand.logoUrl} name={brand.name} />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#aaa' }}>no logo</span>
                  )}
                </div>

                {/* Brand name + current URL */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <p style={{ fontWeight: 700, marginBottom: '4px' }}>{brand.name}</p>
                  <p style={{ fontSize: '12px', color: '#888', wordBreak: 'break-all' }}>
                    {brand.logoUrl ?? '—'}
                  </p>
                </div>

                {/* Clear button */}
                {brand.logoUrl && (
                  <button
                    onClick={() => saveLogo(brand.id, null)}
                    disabled={saving === brand.id}
                    style={{ padding: '7px 12px', background: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}
                  >
                    {saving === brand.id ? 'Saving…' : 'Clear'}
                  </button>
                )}
              </div>

              {/* URL input + upload */}
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="url"
                  placeholder="https://cdn.example.com/brand-logo.svg"
                  value={urlInputs[brand.id] ?? ''}
                  onChange={(e) => setUrlInputs((prev) => ({ ...prev, [brand.id]: e.target.value }))}
                  style={{ flex: 1, minWidth: '220px', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
                />
                <button
                  onClick={() => {
                    const url = urlInputs[brand.id]?.trim();
                    if (url) saveLogo(brand.id, url);
                  }}
                  disabled={!urlInputs[brand.id]?.trim() || saving === brand.id}
                  style={{ padding: '8px 14px', background: '#6c534e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                  {saving === brand.id ? 'Saving…' : 'Save URL'}
                </button>
                <ImageUpload
                  folder="brands"
                  onUpload={(url) => saveLogo(brand.id, url)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
