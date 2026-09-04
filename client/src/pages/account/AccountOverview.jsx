import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AccountOverview() {
  const { user, isAdmin } = useAuth();
  return (
    <div>
      <h2>Overview</h2>
      <p className="lede">Signed in as {user?.email}</p>
      <div className="account-cards">
        <Link className="panel account-card" to="/account/orders">Orders</Link>
        <Link className="panel account-card" to="/account/purchases">Purchases</Link>
        <Link className="panel account-card" to="/account/returns">Returns</Link>
        <Link className="panel account-card" to="/account/wishlist">Wishlist</Link>
        {isAdmin && <Link className="panel account-card" to="/admin">Admin</Link>}
      </div>
    </div>
  );
}
