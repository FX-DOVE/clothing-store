import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, ErrorState, formatMoney } from '../components/States.jsx';
import ProductImageGallery from '../components/ProductImageGallery.jsx';

const RECENT_KEY = 'ngbabies_recently_viewed';

function pushRecentlyViewed(product) {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const next = [{ id: product.id, name: product.name, image: product.images?.[0] }, ...raw.filter((x) => x.id !== product.id)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [formError, setFormError] = useState('');
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [recent, setRecent] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await api.getProduct(id);
      setProduct(p);
      setSize(p.sizes?.[0] || '');
      setColor(p.colors?.[0] || '');
      pushRecentlyViewed(p);
      try {
        const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        const cleaned = raw.filter((x) => x.id && x.id.startsWith('b'));
        if (cleaned.length !== raw.length) {
          localStorage.setItem(RECENT_KEY, JSON.stringify(cleaned));
          localStorage.removeItem('atelier_recently_viewed');
        }
        setRecent(cleaned.filter((x) => x.id !== p.id));
      } catch {
        setRecent([]);
      }
      if (user) {
        try {
          const wl = await api.getWishlist();
          setWished((wl.productIds || []).includes(p.id));
        } catch {
          setWished(false);
        }
      } else {
        setWished(false);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, user]);

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

  const onWish = async () => {
    if (!user) {
      setFormError('Sign in to save items to your wishlist.');
      return;
    }
    setWishBusy(true);
    setFormError('');
    try {
      if (wished) {
        await api.removeWishlist(product.id);
        setWished(false);
      } else {
        await api.addWishlist(product.id);
        setWished(true);
      }
    } catch (e) {
      setFormError(e.message);
    } finally {
      setWishBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!product) return null;

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="page product-detail">
      <div className="pdp-grid">
        <ProductImageGallery images={product.images} alt={product.name} />
        <div className="pdp-info">
          {(product.newSeason || product.exclusive) && (
            <div className="pdp-badges">
              {product.newSeason && <span className="product-badge">New Season</span>}
              {product.exclusive && <span className="product-badge">Exclusive</span>}
            </div>
          )}
          <p className="pdp-brand">{product.brand || 'NG BABIES'}</p>
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
            <button type="button" className="size-guide-toggle" onClick={() => setSizeGuideOpen((v) => !v)}>
              {sizeGuideOpen ? 'Hide size guide' : 'Size guide'}
            </button>
            {sizeGuideOpen && (
              <div className="size-guide panel">
                <p className="tiny muted">Stub guide — measure bust/waist/hip and compare to brand sizing. XS–XL typically map to EU 32–42.</p>
                <table className="size-guide-table">
                  <thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hip</th></tr></thead>
                  <tbody>
                    <tr><td>XS</td><td>80–84</td><td>62–66</td><td>86–90</td></tr>
                    <tr><td>S</td><td>84–88</td><td>66–70</td><td>90–94</td></tr>
                    <tr><td>M</td><td>88–92</td><td>70–74</td><td>94–98</td></tr>
                    <tr><td>L</td><td>92–98</td><td>74–80</td><td>98–104</td></tr>
                  </tbody>
                </table>
              </div>
            )}
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
            onClick={onWish}
            disabled={wishBusy}
            style={{ marginTop: '0.65rem' }}
          >
            {wished ? 'Saved to wishlist' : 'Add to wishlist'}
          </button>
        </div>
      </div>

      {recent.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Recently viewed</h2></div>
          <div className="recent-row">
            {recent.map((r) => (
              <Link key={r.id} to={`/product/${r.id}`} className="recent-card">
                <img src={r.image} alt="" />
                <span>{r.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
