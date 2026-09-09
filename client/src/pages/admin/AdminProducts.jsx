import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading, ErrorState, formatMoney } from '../../components/States.jsx';

const empty = {
  name: '', brand: 'NG BABIES', category: 'tops', price: '', compareAtPrice: '',
  description: '', sizes: '0-3M, 3-6M, 6-12M, 12-18M, 18-24M', colors: 'White, Cream, Sage, Blush, Sky Blue',
  images: '', featured: false, newSeason: false, exclusive: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

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
      images: (p.images || []).join(','),
      featured: !!p.featured,
      newSeason: !!p.newSeason,
      exclusive: !!p.exclusive,
    });
  };

  const resetForm = () => {
    setEditId(null);
    setForm(empty);
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
    images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
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
        <label className="field"><span>Image URLs (comma)</span><input name="images" value={form.images} onChange={onChange} /></label>
        <div className="chip-row" style={{ marginBottom: '1rem' }}>
          <label><input type="checkbox" name="featured" checked={form.featured} onChange={onChange} /> Featured</label>
          <label><input type="checkbox" name="newSeason" checked={form.newSeason} onChange={onChange} /> New season</label>
          <label><input type="checkbox" name="exclusive" checked={form.exclusive} onChange={onChange} /> Exclusive</label>
        </div>
        <div className="hero-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
          {editId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <ul className="order-list">
        {products.map((p) => (
          <li key={p.id} className="panel order-row">
            <div>
              <strong>{p.name}</strong>
              <p className="muted tiny">{p.category} · {formatMoney(p.price)}</p>
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
