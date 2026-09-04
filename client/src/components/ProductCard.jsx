import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatMoney } from './States.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProductCard({ product, wishlistIds, onWishlistChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wished, setWished] = useState(false);
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  useEffect(() => {
    if (wishlistIds) setWished(wishlistIds.includes(product.id));
  }, [wishlistIds, product.id]);

  useEffect(() => {
    if (wishlistIds || !user) return undefined;
    let cancelled = false;
    api.getWishlist().then((data) => {
      if (!cancelled) setWished((data.productIds || []).includes(product.id));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user, product.id, wishlistIds]);

  const toggleWish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (wished) {
        await api.removeWishlist(product.id);
        setWished(false);
      } else {
        await api.addWishlist(product.id);
        setWished(true);
      }
      onWishlistChange?.();
    } catch {
      /* ignore */
    }
  };

  return (
    <article className="product-card">
      <button
        type="button"
        className={`wishlist-toggle ${wished ? 'active' : ''}`}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
        onClick={toggleWish}
      >
        <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-6.5-4.35-9.33-8.1C.8 10.4 1.2 6.8 4.05 5.15 6.1 4 8.55 4.55 10 6.2 11.45 4.55 13.9 4 15.95 5.15c2.85 1.65 3.25 5.25 1.38 7.75C18.5 16.65 12 21 12 21z" />
        </svg>
      </button>

      <Link to={`/product/${product.id}`} className="product-card-link">
        <div className="product-card-media">
          {(product.newSeason || product.exclusive) && (
            <div className="product-badges">
              {product.newSeason && <span className="product-badge">New Season</span>}
              {product.exclusive && <span className="product-badge">Exclusive</span>}
            </div>
          )}
          <img src={product.images?.[0]} alt="" loading="lazy" />
        </div>
        <div className="product-card-body">
          <p className="product-brand">{product.brand || 'Atelier'}</p>
          <h3 className="product-name">{product.name}</h3>
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
        </div>
      </Link>
    </article>
  );
}
