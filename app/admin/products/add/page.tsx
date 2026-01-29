'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ImageUpload from '@/components/ImageUpload';

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    size: 50,
    price: 0,
    concentration: 'Eau de Parfum',
    gender: 'Unisex',
    description: '',
    discountAmount: 0,
    isFeatured: false,
    isBestSeller: false,
    stock: 0,
    topNotes: '',
    heartNotes: '',
    baseNotes: '',
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageUpload = (url: string) => {
    setImages([...images, url]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          size: parseInt(formData.size.toString()),
          price: parseFloat(formData.price.toString()),
          discountAmount: parseFloat(formData.discountAmount.toString()),
          stock: parseInt(formData.stock.toString()),
          images,
          topNotes: formData.topNotes.split(',').map(s => s.trim()),
          heartNotes: formData.heartNotes.split(',').map(s => s.trim()),
          baseNotes: formData.baseNotes.split(',').map(s => s.trim()),
        }),
      });

      if (response.ok) {
        alert('Product added successfully!');
        router.push('/admin/products');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '120px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>Add New Product</h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Brand Name *</label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label>Size (ml) *</label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              />
            </div>

            <div>
              <label>Price ($) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                required
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label>Concentration *</label>
              <select
                name="concentration"
                value={formData.concentration}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              >
                <option>Eau de Parfum</option>
                <option>Eau de Toilette</option>
                <option>Parfum</option>
                <option>Eau de Cologne</option>
              </select>
            </div>

            <div>
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              >
                <option>Men</option>
                <option>Women</option>
                <option>Unisex</option>
              </select>
            </div>
          </div>

          <div>
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label>Discount Amount ($)</label>
              <input
                type="number"
                name="discountAmount"
                value={formData.discountAmount}
                onChange={handleChange}
                step="0.01"
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              />
            </div>

            <div>
              <label>Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              />
            </div>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
              />
              {' '}Featured Product
            </label>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                name="isBestSeller"
                checked={formData.isBestSeller}
                onChange={handleChange}
              />
              {' '}Best Seller
            </label>
          </div>

          <div>
            <label>Top Notes (comma separated)</label>
            <input
              type="text"
              name="topNotes"
              value={formData.topNotes}
              onChange={handleChange}
              placeholder="Bergamot, Lemon, Orange"
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Heart Notes (comma separated)</label>
            <input
              type="text"
              name="heartNotes"
              value={formData.heartNotes}
              onChange={handleChange}
              placeholder="Jasmine, Rose, Lavender"
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Base Notes (comma separated)</label>
            <input
              type="text"
              name="baseNotes"
              value={formData.baseNotes}
              onChange={handleChange}
              placeholder="Musk, Vanilla, Sandalwood"
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Product Images</label>
            <div style={{ marginTop: '10px' }}>
              <ImageUpload onUpload={handleImageUpload} />
            </div>
            
            {images.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                {images.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img src={url} alt={`Product ${index + 1}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '15px', background: '#6c534e', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
}