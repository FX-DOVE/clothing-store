import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

function SearchIcon() {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-6.5-4.35-9.33-8.1C.8 10.4 1.2 6.8 4.05 5.15 6.1 4 8.55 4.55 10 6.2 11.45 4.55 13.9 4 15.95 5.15c2.85 1.65 3.25 5.25 1.38 7.75C18.5 16.65 12 21 12 21z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

export default function Header() {
  const { cart } = useCart();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setMenuOpen(false);
    setSearchOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          type="button"
          className="icon-btn menu-btn"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => { setMenuOpen((v) => !v); setSearchOpen(false); }}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
        </button>

        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          Atelier
        </Link>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Primary">
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/shop" onClick={() => setMenuOpen(false)}>Clothing</NavLink>
          <NavLink to="/shop?category=tops" onClick={() => setMenuOpen(false)}>Tops</NavLink>
          <NavLink to="/shop?category=bottoms" onClick={() => setMenuOpen(false)}>Bottoms</NavLink>
          <NavLink to="/shop?category=outerwear" onClick={() => setMenuOpen(false)}>Outerwear</NavLink>
          <NavLink to="/shop?category=accessories" onClick={() => setMenuOpen(false)}>Accessories</NavLink>
        </nav>

        <div className={`search-panel ${searchOpen ? 'open' : ''}`}>
          <form className="search-form" onSubmit={onSearch} role="search">
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input
              id="site-search"
              type="search"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              enterKeyHint="search"
            />
          </form>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn search-toggle"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => { setSearchOpen((v) => !v); setMenuOpen(false); }}
          >
            <SearchIcon />
          </button>
          <button type="button" className="wishlist-btn" aria-label="Wishlist" title="Wishlist">
            <HeartIcon />
          </button>
          <Link to="/cart" className="cart-link" aria-label={`Bag, ${cart.itemCount || 0} items`}>
            <BagIcon />
            {(cart.itemCount || 0) > 0 && <span className="cart-badge">{cart.itemCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
