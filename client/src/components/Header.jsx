import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';


function MenuIcon({ open = false }) {
  if (open) {
    return (
      <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

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
  const { user, logout, isAdmin } = useAuth();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setMenuOpen(false);
    setSearchOpen(false);
  };

  const onLogout = async () => {
    setAccountOpen(false);
    await logout();
    navigate('/');
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
          <MenuIcon open={menuOpen} />
        </button>

        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          NG BABIES
        </Link>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Primary">
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/shop" onClick={() => setMenuOpen(false)}>All Baby Clothes</NavLink>
          <NavLink to="/shop?category=tops" onClick={() => setMenuOpen(false)}>Tops & Rompers</NavLink>
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
          {/* Bag / account live in bottom nav on mobile */}
          <button
            type="button"
            className="icon-btn search-toggle"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => { setSearchOpen((v) => !v); setMenuOpen(false); }}
          >
            <SearchIcon />
          </button>

          <div className="account-menu header-desktop-only" ref={accountRef}>
            {user ? (
              <>
                <button
                  type="button"
                  className="icon-btn account-avatar"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((v) => !v)}
                >
                  <span className="avatar-initial">{(user.name || 'A').charAt(0).toUpperCase()}</span>
                </button>
                {accountOpen && (
                  <div className="account-dropdown" role="menu">
                    <Link to="/account" role="menuitem" onClick={() => setAccountOpen(false)}>Dashboard</Link>
                    <Link to="/account/orders" role="menuitem" onClick={() => setAccountOpen(false)}>Orders</Link>
                    {isAdmin && <Link to="/admin" role="menuitem" onClick={() => setAccountOpen(false)}>Admin</Link>}
                    <button type="button" role="menuitem" onClick={onLogout}>Logout</button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="icon-btn account-link" aria-label="Account">Account</Link>
            )}
          </div>

          <Link to={user ? '/account/wishlist' : '/login'} className="wishlist-btn header-desktop-only" aria-label="Wishlist" title="Wishlist">
            <HeartIcon />
          </Link>
          <Link to="/cart" className="cart-link header-desktop-only" aria-label={`Bag, ${cart.itemCount || 0} items`}>
            <BagIcon />
            {(cart.itemCount || 0) > 0 && <span className="cart-badge">{cart.itemCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
