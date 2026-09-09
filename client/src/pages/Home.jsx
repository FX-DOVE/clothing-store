import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import { Loading, ErrorState } from '../components/States.jsx';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [products, cats] = await Promise.all([api.getProducts(), api.getCategories()]);
      setFeatured(products.filter((p) => p.featured).slice(0, 8));
      setCategories(cats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading label="Loading collection…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page home">
      <section className="hero">
        <p className="eyebrow">NG BABIES</p>
        <h1>Baby clothes in Nigeria, soft cotton for newborns and toddlers</h1>
        <p className="lede">
          Shop soft cotton rompers, dresses, two-piece sets, and sleepwear sized for newborns through toddlers, with nationwide delivery across Nigeria.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/shop">Shop baby collection</Link>
          <Link className="btn btn-secondary" to="/shop?category=outerwear">Cozy knitwear & jackets</Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Shop by category</h2>
        </div>
        <div className="category-grid">
          {categories.map((c) => (
            <Link key={c.id} to={`/shop?category=${c.id}`} className="category-card">
              <h3>{c.name}</h3>
              <p>{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Featured baby favorites</h2>
          <Link to="/shop">View all</Link>
        </div>
        <div className="product-grid">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
