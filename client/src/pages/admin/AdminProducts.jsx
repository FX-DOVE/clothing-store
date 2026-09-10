import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading, ErrorState, formatMoney } from '../../components/States.jsx';

const empty = {
  name: '', brand: 'NG BABIES', category: 'tops', price: '', compareAtPrice: '',
  description: '', sizes: '0-3M, 3-6M, 6-12M, 12-18M, 18-24M', colors: 'White, Cream, Sage, Blush, Sky Blue',
  featured: false, newSeason: false, exclusive: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setProducts(await api.adminProducts());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      brand: p.brand || '',
      category: p.category,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : '',
      description: p.description || '',
      sizes: (p.sizes || []).join(','),
      colors: (p.colors || []).join(','),
      featured: !!p.featured,
      newSeason: !!p.newSeason,
      exclusive: !!p.exclusive,
    });
    setImages([...(p.images || [])]);
    setImageUrlInput('');
  };

  const resetForm = () => {
    setEditId(null);
    setForm(empty);
    setImages([]);
    setImageUrlInput('');
  };

  const addUrlsFromText = (text) => {
    const parts = String(text || '')
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setImages((prev) => {
      const next = [...prev];
      for (const url of parts) {
        if (!next.includes(url)) next.push(url);
      }
      return next;
    });
  };

  const onAddImageUrls = (e) => {
    e.preventDefault();
    addUrlsFromText(imageUrlInput);
    setImageUrlInput('');
  };

  const onRemoveImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} must be 5MB or smaller`);
          continue;
        }
        const result = await api.adminUploadImage(file);
        if (result?.url) {
          setImages((prev) => (prev.includes(result.url) ? prev : [...prev, result.url]));
        }
      }
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toPayload = () => ({
    name: form.name,
    brand: form.brand,
    category: form.category,
    price: Number(form.price),
    compareAtPrice: form.compareAtPrice === '' ? '' : Number(form.compareAtPrice),
    description: form.description,
    sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
    colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
    images,
    featured: form.featured,
    newSeason: form.newSeason,
    exclusive: form.exclusive,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await api.adminUpdateProduct(editId, toPayload());
      else await api.adminCreateProduct(toPayload());
      resetForm();
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.adminDeleteProduct(id);
    await load();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h2>Products</h2>
      <form className="panel" onSubmit={onSubmit} style={{ marginBottom: '1.5rem' }}>
        <h3>{editId ? 'Edit product' : 'Create product'}</h3>
        <div className="field-row">
          <label className="field"><span>Name</span><input required name="name" value={form.name} onChange={onChange} /></label>
          <label className="field"><span>Brand</span><input name="brand" value={form.brand} onChange={onChange} /></label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Category</span>
            <select name="category" value={form.category} onChange={onChange}>
              <option value="tops">tops</option>
              <option value="bottoms">bottoms</option>
              <option value="outerwear">outerwear</option>
              <option value="accessories">accessories</option>
            </select>
          </label>
          <label className="field"><span>Price</span><input required type="number" step="0.01" name="price" value={form.price} onChange={onChange} /></label>
        </div>
        <label className="field"><span>Compare-at price</span><input type="number" step="0.01" name="compareAtPrice" value={form.compareAtPrice} onChange={onChange} /></label>
        <label className="field"><span>Description</span><input name="description" value={form.description} onChange={onChange} /></label>
        <label className="field"><span>Sizes (comma)</span><input name="sizes" value={form.sizes} onChange={onChange} /></label>
        <label className="field"><span>Colors (comma)</span><input name="colors" value={form.colors} onChange={onChange} /></label>

        <div className="field" style={{ marginBottom: '0.75rem' }}>
          <span>Product images</span>
          <div className="field-row" style={{ alignItems: 'flex-end', gap: '0.5rem', marginTop: '0.35rem' }}>
            <label className="field" style={{ flex: 1 }}>
              <span>Image URL / link</span>
              <input
                type="url"
                placeholder="https://… or paste several comma-separated"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddImageUrls(e);
                  }
                }}
              />
            </label>
            <button type="button" className="btn btn-ghost" onClick={onAddImageUrls} disabled={!imageUrlInput.trim()}>
              Add link
            </button>
          </div>
          <label className="field" style={{ marginTop: '0.5rem' }}>
            <span>Or upload image files</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              disabled={uploading || saving}
            />
          </label>
          {uploading && <p className="muted tiny">Uploading…</p>}
          {images.length > 0 && (
            <div
              className="chip-row"
              style={{
                marginTop: '0.75rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              {images.map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  style={{
                    position: 'relative',
                    width: 88,
                    height: 110,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: '#f6f4f1',
                  }}
                >
                  <img
                    src={src}
                    alt={`Product ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label="Remove image"
                    onClick={() => onRemoveImage(idx)}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      padding: '0.15rem 0.4rem',
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.9)',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="muted tiny" style={{ marginTop: '0.35rem' }}>
            Mix https links and uploaded files. Remove any thumbnail before saving.
          </p>
        </div>

        <div className="chip-row" style={{ marginBottom: '1rem' }}>
          <label><input type="checkbox" name="featured" checked={form.featured} onChange={onChange} /> Featured</label>
          <label><input type="checkbox" name="newSeason" checked={form.newSeason} onChange={onChange} /> New season</label>
          <label><input type="checkbox" name="exclusive" checked={form.exclusive} onChange={onChange} /> Exclusive</label>
        </div>
        <div className="hero-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
            {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
          </button>
          {editId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <ul className="order-list">
        {products.map((p) => (
          <li key={p.id} className="panel order-row">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {p.images?.[0] && (
                <img
                  src={p.images[0]}
                  alt=""
                  style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 6 }}
                />
              )}
              <div>
                <strong>{p.name}</strong>
                <p className="muted tiny">{p.category} · {formatMoney(p.price)}</p>
              </div>
            </div>
            <div className="order-row-meta">
              <button type="button" className="btn btn-ghost" onClick={() => startEdit(p)}>Edit</button>
              <button type="button" className="btn btn-ghost" onClick={() => onDelete(p.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
