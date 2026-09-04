import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Loading, ErrorState, EmptyState } from '../../components/States.jsx';

export default function Purchases() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api.getMyPurchases());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items.length) return <EmptyState title="No purchases yet" message="Products you buy will show here." />;

  return (
    <div>
      <h2>Purchases</h2>
      <div className="product-grid">
        {items.map((p) => (
          <article key={p.productId} className="product-card">
            <Link to={`/product/${p.productId}`} className="product-card-link">
              <div className="product-card-media">
                <img src={p.image} alt="" loading="lazy" />
              </div>
              <div className="product-card-body">
                <h3 className="product-name">{p.name}</h3>
                <p className="muted tiny">Bought {p.timesPurchased}× · qty {p.totalQty}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
