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
        <p className="eyebrow">New arrivals</p>
        <h1>Designer clothing, curated for everyday luxury</h1>
        <p className="lede">Discover refined pieces from independent labels — tops, bottoms, outerwear, and accessories.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/shop">Shop clothing</Link>
          <Link className="btn btn-secondary" to="/shop?category=outerwear">Explore outerwear</Link>
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
          <h2>Featured selection</h2>
          <Link to="/shop">View all</Link>
        </div>
        <div className="product-grid">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
