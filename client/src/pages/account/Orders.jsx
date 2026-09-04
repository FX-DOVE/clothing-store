import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Loading, ErrorState, EmptyState, formatMoney } from '../../components/States.jsx';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await api.getMyOrders());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!orders.length) {
    return <EmptyState title="No orders yet" message="When you place an order it will appear here." action={<Link className="btn btn-primary" to="/shop">Shop</Link>} />;
  }

  return (
    <div>
      <h2>Orders</h2>
      <ul className="order-list">
        {orders.map((o) => (
          <li key={o.id} className="panel order-row">
            <div>
              <Link to={`/account/orders/${o.id}`}><strong>{o.id.slice(0, 8)}…</strong></Link>
              <p className="muted tiny">{new Date(o.createdAt).toLocaleString()} · {o.status}</p>
            </div>
            <div className="order-row-meta">
              <span>{formatMoney(o.total)}</span>
              <Link className="btn btn-ghost" to={`/account/orders/${o.id}`}>Track</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
