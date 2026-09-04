import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading, ErrorState, formatMoney } from '../../components/States.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setStats(await api.adminStats());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h2>Overview</h2>
      <div className="stats-grid">
        <div className="panel stat-card"><p className="eyebrow">Revenue</p><p className="stat-value">{formatMoney(stats.revenue)}</p></div>
        <div className="panel stat-card"><p className="eyebrow">Orders</p><p className="stat-value">{stats.orderCount}</p></div>
        <div className="panel stat-card"><p className="eyebrow">Products</p><p className="stat-value">{stats.productCount}</p></div>
        <div className="panel stat-card"><p className="eyebrow">Expenses</p><p className="stat-value">{formatMoney(stats.expenseTotal)}</p></div>
      </div>
    </div>
  );
}
