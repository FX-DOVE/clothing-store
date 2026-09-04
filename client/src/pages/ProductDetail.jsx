import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { Loading, ErrorState, formatMoney } from '../components/States.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [formError, setFormError] = useState('');
  const [wished, setWished] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await api.getProduct(id);
      setProduct(p);
      setSize(p.sizes?.[0] || '');
      setColor(p.colors?.[0] || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const onAdd = async () => {
    setFormError('');
    setAdded(false);
    if (!size || !color) {
      setFormError('Please choose a size and color.');
      return;
    }
    setAdding(true);
    try {
      await addItem({ productId: product.id, size, color, qty });
      setAdded(true);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!product) return null;

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="page product-detail">
      <div className="pdp-grid">
        <div className="pdp-gallery">
          <img src={product.images[imageIdx]} alt={product.name} />
          {product.images.length > 1 && (
            <div className="thumbs">
              {product.images.map((src, i) => (
                <button key={src} type="button" className={`thumb ${i === imageIdx ? 'active' : ''}`} onClick={() => setImageIdx(i)} aria-label={`Image ${i + 1}`}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pdp-info">
          {(product.newSeason || product.exclusive) && (
            <div className="pdp-badges">
              {product.newSeason && <span className="product-badge">New Season</span>}
              {product.exclusive && <span className="product-badge">Exclusive</span>}
            </div>
          )}
          <p className="pdp-brand">{product.brand || 'Atelier'}</p>
          <h1>{product.name}</h1>
          <div className="price-row">
            {onSale ? (
              <>
                <span className="price price-sale">{formatMoney(product.price)}</span>
                <span className="price-compare">{formatMoney(product.compareAtPrice)}</span>
              </>
            ) : (
              <span className="price">{formatMoney(product.price)}</span>
            )}
          </div>
          <p className="lede">{product.description}</p>

          <fieldset className="picker">
            <legend>Size</legend>
            <div className="chip-row">
              {product.sizes.map((s) => (
                <button key={s} type="button" className={`chip ${size === s ? 'selected' : ''}`} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
          </fieldset>

          <fieldset className="picker">
            <legend>Color</legend>
            <div className="chip-row">
              {product.colors.map((c) => (
                <button key={c} type="button" className={`chip ${color === c ? 'selected' : ''}`} onClick={() => setColor(c)}>{c}</button>
              ))}
            </div>
          </fieldset>

          <label className="field qty-field">
            <span>Quantity</span>
            <input type="number" min="1" max="10" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
          </label>

          {formError && <p className="form-error" role="alert">{formError}</p>}
          {added && <p className="form-success" role="status">Added to bag. <Link to="/cart">View bag</Link></p>}

          <button type="button" className="btn btn-primary btn-block" onClick={onAdd} disabled={adding}>
            {adding ? 'Adding…' : 'Add to bag'}
          </button>
          <button
            type="button"
            className={`btn btn-secondary btn-block ${wished ? 'active' : ''}`}
            onClick={() => setWished((v) => !v)}
            style={{ marginTop: '0.65rem' }}
          >
            {wished ? 'Saved to wishlist' : 'Add to wishlist'}
          </button>
        </div>
      </div>
    </div>
  );
}
