import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '24', '26', '28', '30', '32', '34', 'One Size'];
const COLORS = ['Black', 'Ivory', 'Navy', 'Cream', 'Camel', 'Olive', 'Sage', 'White', 'Charcoal', 'Tan'];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = useMemo(() => ({
    category: params.get('category') || '',
    q: params.get('q') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    size: params.get('size') || '',
    color: params.get('color') || '',
    sort: params.get('sort') || '',
  }), [params]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, cats] = await Promise.all([api.getProducts(query), api.getCategories()]);
      setProducts(list);
      setCategories(cats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [params]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (query.q) next.set('q', query.q);
    setParams(next);
  };

  return (
    <div className="page shop">
      <div className="section-head">
        <div>
          <p className="eyebrow">Collection</p>
          <h1>{query.q ? `Results for “${query.q}”` : 'Shop'}</h1>
        </div>
        <button type="button" className="btn btn-secondary filters-toggle" onClick={() => setFiltersOpen((v) => !v)}>
          {filtersOpen ? 'Hide filters' : 'Filters & sort'}
        </button>
      </div>

      <div className={`shop-layout ${filtersOpen ? 'filters-open' : ''}`}>
        <aside className="filters" aria-label="Filters">
          <label className="field">
            <span>Category</span>
            <select value={query.category} onChange={(e) => update('category', e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Sort</span>
            <select value={query.sort} onChange={(e) => update('sort', e.target.value)}>
              <option value="">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
          <div className="field-row">
            <label className="field">
              <span>Min $</span>
              <input type="number" min="0" inputMode="decimal" value={query.minPrice} onChange={(e) => update('minPrice', e.target.value)} />
            </label>
            <label className="field">
              <span>Max $</span>
              <input type="number" min="0" inputMode="decimal" value={query.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Size</span>
            <select value={query.size} onChange={(e) => update('size', e.target.value)}>
              <option value="">Any</option>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Color</span>
            <select value={query.color} onChange={(e) => update('color', e.target.value)}>
              <option value="">Any</option>
              {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>
        </aside>

        <div className="shop-results">
          {loading && <Loading />}
          {!loading && error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && products.length === 0 && (
            <EmptyState title="No products found" message="Try adjusting filters or search." action={<button type="button" className="btn btn-secondary" onClick={clearFilters}>Reset</button>} />
          )}
          {!loading && !error && products.length > 0 && (
            <>
              <p className="muted results-count">{products.length} item{products.length === 1 ? '' : 's'}</p>
              <div className="product-grid">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
