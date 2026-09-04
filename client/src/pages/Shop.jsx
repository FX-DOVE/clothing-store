import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '24', '26', '28', '30', '32', '34', 'One Size'];
const COLORS = ['Black', 'Ivory', 'Navy', 'Cream', 'Camel', 'Olive', 'Sage', 'White', 'Charcoal', 'Tan'];

const CATEGORY_TITLES = {
  tops: 'Designer Tops for Women',
  bottoms: 'Designer Bottoms for Women',
  outerwear: 'Designer Outerwear for Women',
  accessories: 'Designer Accessories for Women',
};

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

  const pageTitle = useMemo(() => {
    if (query.q) return `Results for “${query.q}”`;
    if (query.category && CATEGORY_TITLES[query.category]) return CATEGORY_TITLES[query.category];
    return 'Designer Clothing for Women';
  }, [query.q, query.category]);

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

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

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

  const filtersPanel = (
    <aside className={`filters drawer ${filtersOpen ? 'open' : ''}`} aria-label="Filters">
      <div className="filters-head">
        <h2>Filter</h2>
        <button type="button" className="btn btn-ghost drawer-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
          Close
        </button>
      </div>

      <div className="filter-group">
        <p className="filter-group-title">Category</p>
        <label className="field">
          <span className="sr-only">Category</span>
          <select value={query.category} onChange={(e) => update('category', e.target.value)}>
            <option value="">All clothing</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <div className="filter-group">
        <p className="filter-group-title">Price</p>
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
      </div>

      <div className="filter-group">
        <p className="filter-group-title">Size</p>
        <label className="field">
          <span className="sr-only">Size</span>
          <select value={query.size} onChange={(e) => update('size', e.target.value)}>
            <option value="">Any</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="filter-group">
        <p className="filter-group-title">Color</p>
        <label className="field">
          <span className="sr-only">Color</span>
          <select value={query.color} onChange={(e) => update('color', e.target.value)}>
            <option value="">Any</option>
            {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <button type="button" className="btn btn-secondary btn-block" onClick={clearFilters}>Clear all</button>
    </aside>
  );

  return (
    <div className="page shop">
      <div className="shop-page-title">
        <p className="eyebrow">Women</p>
        <h1>{pageTitle}</h1>
      </div>

      <div className="shop-toolbar">
        <p className="results-count">
          {loading ? 'Loading…' : `${products.length} item${products.length === 1 ? '' : 's'}`}
        </p>
        <div className="toolbar-controls">
          <button type="button" className="btn btn-secondary filters-toggle" onClick={() => setFiltersOpen(true)}>
            Filter
          </button>
          <div className="sort-control">
            <label htmlFor="shop-sort">Sort</label>
            <select id="shop-sort" value={query.sort} onChange={(e) => update('sort', e.target.value)}>
              <option value="">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className={`filter-drawer-backdrop ${filtersOpen ? 'open' : ''}`}
        onClick={() => setFiltersOpen(false)}
        aria-hidden="true"
      />

      <div className="shop-layout">
        {filtersPanel}

        <div className="shop-results">
          {loading && <Loading />}
          {!loading && error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && products.length === 0 && (
            <EmptyState
              title="No products found"
              message="Try adjusting filters or search."
              action={<button type="button" className="btn btn-secondary" onClick={clearFilters}>Reset</button>}
            />
          )}
          {!loading && !error && products.length > 0 && (
            <div className="product-grid">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
