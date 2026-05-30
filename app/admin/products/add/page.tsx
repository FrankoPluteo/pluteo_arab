'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ImageUpload from '@/components/ImageUpload';
import s from '@/styles/admin.module.css';

const CONCENTRATIONS = ['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Eau de Cologne', 'Extrait de Parfum'];
const GENDERS = ['Unisex', 'Men', 'Women'];

const EMPTY = {
  name: '',
  brandName: '',
  size: '50',
  price: '',
  discountAmount: '0',
  stock: '0',
  concentration: 'Eau de Parfum',
  gender: 'Unisex',
  description: '',
  descriptionHr: '',
  isFeatured: false,
  isBestSeller: false,
  // EN notes
  fragranceProfiles: '',
  topNotes: '',
  heartNotes: '',
  baseNotes: '',
  // HR notes
  fragranceProfilesHr: '',
  topNotesHr: '',
  heartNotesHr: '',
  baseNotesHr: '',
};

function splitTags(s: string) {
  return s.split(',').map((t) => t.trim()).filter(Boolean);
}

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addImage = (url: string) => setImages((imgs) => [...imgs, url]);
  const removeImage = (i: number) => setImages((imgs) => imgs.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          brandName: form.brandName,
          size: parseInt(form.size),
          price: parseFloat(form.price),
          discountAmount: parseFloat(form.discountAmount) || 0,
          stock: parseInt(form.stock) || 0,
          concentration: form.concentration,
          gender: form.gender,
          description: form.description,
          descriptionHr: form.descriptionHr || null,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          images,
          fragranceProfiles: splitTags(form.fragranceProfiles),
          topNotes: splitTags(form.topNotes),
          heartNotes: splitTags(form.heartNotes),
          baseNotes: splitTags(form.baseNotes),
          fragranceProfilesHr: splitTags(form.fragranceProfilesHr),
          topNotesHr: splitTags(form.topNotesHr),
          heartNotesHr: splitTags(form.heartNotesHr),
          baseNotesHr: splitTags(form.baseNotesHr),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBanner({ type: 'error', msg: data.message || 'Failed to create product.' });
      } else {
        setBanner({ type: 'success', msg: `Product "${data.name}" created successfully!` });
        setForm(EMPTY);
        setImages([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setBanner({ type: 'error', msg: 'Network error — please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={s.page} style={{ marginTop: '100px' }}>
        <div className={s.header}>
          <h1 className={s.title}>ADD NEW PRODUCT</h1>
          <p className={s.subtitle}>Fill in all fields. Notes and Croatian content are optional but recommended.</p>
        </div>

        {banner && (
          <div className={`${s.banner} ${banner.type === 'success' ? s.bannerSuccess : s.bannerError}`}>
            {banner.msg}
          </div>
        )}

        <form className={s.form} onSubmit={handleSubmit}>

          {/* ── Basic info ── */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Basic Info</div>

            <div className={s.row} style={{ gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className={s.field}>
                <label className={s.label}>Product Name *</label>
                <input className={s.input} name="name" value={form.name} onChange={set} required placeholder="e.g. Baccarat Rouge 540" />
              </div>
              <div className={s.field}>
                <label className={s.label}>Brand *</label>
                <input className={s.input} name="brandName" value={form.brandName} onChange={set} required placeholder="e.g. Maison Francis Kurkdjian" />
                <span className={s.hint}>Created automatically if it doesn't exist yet</span>
              </div>
            </div>

            <div className={`${s.row} ${s.row3}`} style={{ marginBottom: '20px' }}>
              <div className={s.field}>
                <label className={s.label}>Concentration *</label>
                <select className={s.select} name="concentration" value={form.concentration} onChange={set}>
                  {CONCENTRATIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>Gender *</label>
                <select className={s.select} name="gender" value={form.gender} onChange={set}>
                  {GENDERS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>Size (ml) *</label>
                <input className={s.input} type="number" name="size" value={form.size} onChange={set} required min={1} />
              </div>
            </div>

            <div className={s.field}>
              <label className={s.label}>Description (EN) *</label>
              <textarea className={s.textarea} name="description" value={form.description} onChange={set} required rows={4} placeholder="Describe the fragrance in English…" />
            </div>
          </div>

          {/* ── Pricing & inventory ── */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Pricing & Inventory</div>
            <div className={`${s.row} ${s.row3}`}>
              <div className={s.field}>
                <label className={s.label}>Price (€) *</label>
                <input className={s.input} type="number" name="price" value={form.price} onChange={set} required step="0.01" min={0} placeholder="0.00" />
              </div>
              <div className={s.field}>
                <label className={s.label}>Discount Amount (€) <span className={s.labelOptional}>optional</span></label>
                <input className={s.input} type="number" name="discountAmount" value={form.discountAmount} onChange={set} step="0.01" min={0} placeholder="0.00" />
                <span className={s.hint}>Subtracted from price at checkout</span>
              </div>
              <div className={s.field}>
                <label className={s.label}>Stock *</label>
                <input className={s.input} type="number" name="stock" value={form.stock} onChange={set} required min={0} />
              </div>
            </div>

            <div className={s.checkRow} style={{ marginTop: '20px' }}>
              <label className={s.checkLabel}>
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={set} />
                Featured on homepage
              </label>
              <label className={s.checkLabel}>
                <input type="checkbox" name="isBestSeller" checked={form.isBestSeller} onChange={set} />
                Best Seller badge
              </label>
            </div>
          </div>

          {/* ── Fragrance notes (EN) ── */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Fragrance Notes — English</div>
            <div className={s.field} style={{ marginBottom: '16px' }}>
              <label className={s.label}>Fragrance Profiles <span className={s.labelOptional}>optional</span></label>
              <input className={s.input} name="fragranceProfiles" value={form.fragranceProfiles} onChange={set} placeholder="Woody, Oriental, Floral" />
              <span className={s.hint}>Comma-separated descriptors shown on product page</span>
            </div>
            <div className={`${s.row} ${s.row3}`}>
              <div className={s.field}>
                <label className={s.label}>Top Notes <span className={s.labelOptional}>optional</span></label>
                <input className={s.input} name="topNotes" value={form.topNotes} onChange={set} placeholder="Bergamot, Lemon" />
              </div>
              <div className={s.field}>
                <label className={s.label}>Heart Notes <span className={s.labelOptional}>optional</span></label>
                <input className={s.input} name="heartNotes" value={form.heartNotes} onChange={set} placeholder="Rose, Jasmine" />
              </div>
              <div className={s.field}>
                <label className={s.label}>Base Notes <span className={s.labelOptional}>optional</span></label>
                <input className={s.input} name="baseNotes" value={form.baseNotes} onChange={set} placeholder="Musk, Sandalwood" />
              </div>
            </div>
          </div>

          {/* ── Croatian content ── */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Croatian Content (HR) — optional</div>
            <div className={s.field} style={{ marginBottom: '16px' }}>
              <label className={s.label}>Description (HR)</label>
              <textarea className={s.textarea} name="descriptionHr" value={form.descriptionHr} onChange={set} rows={4} placeholder="Opis mirisa na hrvatskom…" />
            </div>
            <div className={s.field} style={{ marginBottom: '16px' }}>
              <label className={s.label}>Fragrance Profiles (HR)</label>
              <input className={s.input} name="fragranceProfilesHr" value={form.fragranceProfilesHr} onChange={set} placeholder="Drveni, Orijentalni, Cvjetni" />
            </div>
            <div className={`${s.row} ${s.row3}`}>
              <div className={s.field}>
                <label className={s.label}>Top Notes (HR)</label>
                <input className={s.input} name="topNotesHr" value={form.topNotesHr} onChange={set} placeholder="Bergamot, Limun" />
              </div>
              <div className={s.field}>
                <label className={s.label}>Heart Notes (HR)</label>
                <input className={s.input} name="heartNotesHr" value={form.heartNotesHr} onChange={set} placeholder="Ruža, Jasmin" />
              </div>
              <div className={s.field}>
                <label className={s.label}>Base Notes (HR)</label>
                <input className={s.input} name="baseNotesHr" value={form.baseNotesHr} onChange={set} placeholder="Sandalovina, Mošus" />
              </div>
            </div>
          </div>

          {/* ── Images ── */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Product Images</div>
            <ImageUpload onUpload={addImage} />
            {images.length > 0 && (
              <div className={s.imageGrid}>
                {images.map((url, i) => (
                  <div key={i} className={s.imageThumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Product image ${i + 1}`} />
                    <button type="button" className={s.removeImg} onClick={() => removeImage(i)} title="Remove">×</button>
                  </div>
                ))}
              </div>
            )}
            <p className={s.hint} style={{ marginTop: '10px' }}>First image is shown as the product card thumbnail.</p>
          </div>

          <div className={s.actions}>
            <button type="submit" className={s.submitBtn} disabled={loading}>
              {loading ? 'SAVING…' : 'ADD PRODUCT'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
