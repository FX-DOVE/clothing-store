import { NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function HomeIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="7" width="16" height="13" rx="1" />
      <path d="M8 7V6a4 4 0 0 1 8 0v1" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h10v16H7z" />
      <path d="M10 8h4M10 12h4M10 16h3" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5c1.8-3.2 4-4.75 6.5-4.75s4.7 1.55 6.5 4.75" />
    </svg>
  );
}

const HIDDEN_PREFIXES = ['/checkout', '/admin'];

export default function MobileBottomNav() {
  const { cart } = useCart();
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  const ordersTo = user ? '/account/orders' : '/login';
  const profileTo = user ? '/account' : '/login';
  const bagCount = cart.itemCount || 0;

  const shopActive = pathname.startsWith('/shop') || pathname.startsWith('/product');
  const ordersActive = pathname.startsWith('/account/orders');
  const profileActive =
    (pathname.startsWith('/account') && !pathname.startsWith('/account/orders')) ||
    pathname === '/login' ||
    pathname === '/register';

  return (
    <nav className="mobile-bottom-nav" aria-label="App navigation">
      <NavLink to="/" end className={({ isActive }) => `tab-link${isActive ? ' active' : ''}`}>
        <HomeIcon />
        <span>Home</span>
      </NavLink>
      <NavLink to="/shop" className={() => `tab-link${shopActive ? ' active' : ''}`}>
        <ShopIcon />
        <span>Shop</span>
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => `tab-link${isActive ? ' active' : ''}`}>
        <span className="tab-icon-wrap">
          <BagIcon />
          {bagCount > 0 && <span className="tab-badge">{bagCount > 99 ? '99+' : bagCount}</span>}
        </span>
        <span>Bag</span>
      </NavLink>
      <NavLink to={ordersTo} className={() => `tab-link${ordersActive ? ' active' : ''}`}>
        <OrdersIcon />
        <span>Orders</span>
      </NavLink>
      <NavLink to={profileTo} className={() => `tab-link${profileActive ? ' active' : ''}`}>
        <ProfileIcon />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
