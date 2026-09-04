import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="page admin-page">
      <div className="account-header">
        <p className="eyebrow">Admin</p>
        <h1>Dashboard</h1>
      </div>
      <div className="account-layout">
        <nav className="account-nav" aria-label="Admin">
          <NavLink to="/admin" end>Overview</NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/expenses">Expenses</NavLink>
          <NavLink to="/admin/emails">Emails</NavLink>
          <NavLink to="/account">← Account</NavLink>
        </nav>
        <div className="account-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
