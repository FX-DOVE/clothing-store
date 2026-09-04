import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AccountLayout() {
  const { user, isAdmin } = useAuth();
  return (
    <div className="page account-page">
      <div className="account-header">
        <p className="eyebrow">Account</p>
        <h1>{user?.name || 'My account'}</h1>
      </div>
      <div className="account-layout">
        <nav className="account-nav" aria-label="Account">
          <NavLink to="/account" end>Overview</NavLink>
          <NavLink to="/account/orders">Orders</NavLink>
          <NavLink to="/account/purchases">Purchases</NavLink>
          <NavLink to="/account/returns">Returns</NavLink>
          <NavLink to="/account/wishlist">Wishlist</NavLink>
          {isAdmin && <NavLink to="/admin">Admin panel</NavLink>}
        </nav>
        <div className="account-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
