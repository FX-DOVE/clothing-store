import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { cart } = useCart();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          type="button"
          className="icon-btn menu-btn"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>
        <Link to="/" className="logo" onClick={() => setOpen(false)}>
          Atelier
        </Link>
        <nav className={`nav ${open ? 'nav-open' : ''}`} aria-label="Primary">
          <NavLink to="/" end onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/shop" onClick={() => setOpen(false)}>Shop</NavLink>
          <NavLink to="/shop?category=tops" onClick={() => setOpen(false)}>Tops</NavLink>
          <NavLink to="/shop?category=bottoms" onClick={() => setOpen(false)}>Bottoms</NavLink>
          <NavLink to="/shop?category=outerwear" onClick={() => setOpen(false)}>Outerwear</NavLink>
          <NavLink to="/shop?category=accessories" onClick={() => setOpen(false)}>Accessories</NavLink>
        </nav>
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
        <Link to="/cart" className="cart-link" aria-label={`Cart, ${cart.itemCount || 0} items`}>
          <span aria-hidden="true">Bag</span>
          {(cart.itemCount || 0) > 0 && <span className="cart-badge">{cart.itemCount}</span>}
        </Link>
      </div>
    </header>
  );
}
