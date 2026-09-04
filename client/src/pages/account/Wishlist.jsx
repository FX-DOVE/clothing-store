import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import ProductCard from '../../components/ProductCard.jsx';
import { Loading, ErrorState, EmptyState } from '../../components/States.jsx';

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWishlist();
      setProducts(data.products || []);
      setIds(data.productIds || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!products.length) {
    return <EmptyState title="Wishlist is empty" message="Save pieces you love while browsing." action={<Link className="btn btn-primary" to="/shop">Browse</Link>} />;
  }

  return (
    <div>
      <h2>Wishlist</h2>
      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} wishlistIds={ids} onWishlistChange={load} />
        ))}
      </div>
    </div>
  );
}
