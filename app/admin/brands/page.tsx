'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ImageUpload from '@/components/ImageUpload';
import s from '@/styles/admin.module.css';

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  websiteUrl: string | null;
}

// Inline logo preview — shows a warning if the URL is broken
function LogoPreview({ url, name }: { url: string; name: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);

  if (broken) {
    return <span style={{ fontSize: '11px', color: '#c62828', textAlign: 'center' }}>⚠ 404</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} onError={() => setBroken(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
  );
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Per-brand draft state: logoUrl input, description, websiteUrl
  const [drafts, setDrafts] = useState<Record<string, { logoUrl: string; description: string; websiteUrl: string }>>({});

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
              description: p.brand.description ?? null,
              websiteUrl: p.brand.websiteUrl ?? null,
            });
          }
        }
        const list = Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
        setBrands(list);
        // Initialise draft state from current DB values
        const init: typeof drafts = {};
        for (const b of list) {
          init[b.id] = { logoUrl: '', description: b.description ?? '', websiteUrl: b.websiteUrl ?? '' };
        }
        setDrafts(init);
      });
  }, []);

  const setDraft = (id: string, field: 'logoUrl' | 'description' | 'websiteUrl', value: string) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  };

  const flash = (type: 'success' | 'error', msg: string) => {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), 4000);
  };

  async function patch(brandId: string, body: Record<string, string | null>) {
    setSaving(brandId);
    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: Brand = await res.json();
      setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, ...updated } : b)));
      return true;
    } catch (e: any) {
      flash('error', e.message || 'Save failed.');
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function saveLogo(brandId: string, url: string | null) {
    const ok = await patch(brandId, { logoUrl: url });
    if (ok) {
      setDrafts((d) => ({ ...d, [brandId]: { ...d[brandId], logoUrl: '' } }));
      flash('success', 'Logo saved.');
    }
  }

  async function saveMeta(brandId: string) {
    const draft = drafts[brandId];
    const ok = await patch(brandId, {
      description: draft.description || null,
      websiteUrl: draft.websiteUrl || null,
    });
    if (ok) flash('success', 'Brand info updated.');
  }

  return (
    <>
      <Navbar />
      <div className={s.page} style={{ marginTop: '100px' }}>
        <div className={s.header}>
          <h1 className={s.title}>BRANDS</h1>
          <p className={s.subtitle}>
            Edit logo, description, and website URL for each brand. Brands are created automatically
            when a product with a new brand name is added.
          </p>
        </div>

        {banner && (
          <div className={`${s.banner} ${banner.type === 'success' ? s.bannerSuccess : s.bannerError}`}>
            {banner.msg}
          </div>
        )}

        {brands.length === 0 && (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '60px 0' }}>No brands yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {brands.map((brand) => {
            const draft = drafts[brand.id] ?? { logoUrl: '', description: '', websiteUrl: '' };
            const isSaving = saving === brand.id;

            return (
              <div key={brand.id} className={s.brandCard}>
                {/* ── Header row: logo + name ── */}
                <div className={s.brandHeader}>
                  <div className={s.brandLogo}>
                    {brand.logoUrl
                      ? <LogoPreview url={brand.logoUrl} name={brand.name} />
                      : <span className={s.brandLogoPlaceholder}>no logo</span>
                    }
                  </div>
                  <div className={s.brandMeta}>
                    <div className={s.brandName}>{brand.name}</div>
                    {brand.logoUrl && (
                      <div className={s.brandCurrentUrl}>{brand.logoUrl}</div>
                    )}
                  </div>
                  {brand.logoUrl && (
                    <button
                      className={s.clearBtn}
                      onClick={() => saveLogo(brand.id, null)}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving…' : 'Clear logo'}
                    </button>
                  )}
                </div>

                <hr className={s.divider} />

                {/* ── Logo section ── */}
                <div className={s.brandFields}>
                  <div className={s.field}>
                    <label className={s.label}>Logo URL</label>
                    <div className={s.urlRow}>
                      <input
                        type="url"
                        className={s.input}
                        placeholder="https://cdn.example.com/brand-logo.svg"
                        value={draft.logoUrl}
                        onChange={(e) => setDraft(brand.id, 'logoUrl', e.target.value)}
                      />
                      <button
                        className={s.saveBtn}
                        onClick={() => { if (draft.logoUrl.trim()) saveLogo(brand.id, draft.logoUrl.trim()); }}
                        disabled={!draft.logoUrl.trim() || isSaving}
                      >
                        Save URL
                      </button>
                      <ImageUpload folder="brands" onUpload={(url) => saveLogo(brand.id, url)} />
                    </div>
                  </div>

                  {/* ── Description + website ── */}
                  <div className={`${s.row} ${s.row2}`}>
                    <div className={s.field}>
                      <label className={s.label}>Description <span className={s.labelOptional}>optional</span></label>
                      <input
                        className={s.input}
                        placeholder="Short brand description"
                        value={draft.description}
                        onChange={(e) => setDraft(brand.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className={s.field}>
                      <label className={s.label}>Website URL <span className={s.labelOptional}>optional</span></label>
                      <input
                        type="url"
                        className={s.input}
                        placeholder="https://brand.com"
                        value={draft.websiteUrl}
                        onChange={(e) => setDraft(brand.id, 'websiteUrl', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <button className={s.saveBtn} onClick={() => saveMeta(brand.id)} disabled={isSaving}>
                      {isSaving ? 'Saving…' : 'Save Info'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
