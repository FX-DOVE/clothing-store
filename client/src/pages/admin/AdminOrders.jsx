import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading, ErrorState, formatMoney } from '../../components/States.jsx';

const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await api.adminOrders());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onStatus = async (id, status) => {
    await api.adminUpdateOrder(id, { status });
    await load();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h2>Orders</h2>
      <ul className="order-list">
        {orders.map((o) => (
          <li key={o.id} className="panel order-row">
            <div>
              <strong>{o.id.slice(0, 8)}…</strong>
              <p className="muted tiny">{new Date(o.createdAt).toLocaleString()} · {formatMoney(o.total)}</p>
              <p className="muted tiny">{o.shipping?.email}</p>
            </div>
            <label className="field" style={{ margin: 0, minWidth: 140 }}>
              <span>Status</span>
              <select value={o.status} onChange={(e) => onStatus(o.id, e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
