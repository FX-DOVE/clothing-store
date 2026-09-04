import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Loading, ErrorState, formatMoney } from '../../components/States.jsx';

const STEPS = ['placed', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await api.getMyOrder(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return null;

  const currentIdx = STEPS.indexOf(order.status === 'cancelled' ? 'placed' : order.status);

  return (
    <div>
      <p className="tiny"><Link to="/account/orders">← Orders</Link></p>
      <h2>Order {order.id.slice(0, 8)}…</h2>
      <p className="muted">Status: <strong>{order.status}</strong></p>

      {order.status !== 'cancelled' && (
        <ol className="timeline">
          {STEPS.map((step, i) => (
            <li key={step} className={i <= currentIdx ? 'done' : ''}>
              <span className="timeline-dot" />
              <div>
                <strong>{step}</strong>
                {order.timeline?.find((t) => t.status === step) && (
                  <p className="muted tiny">{new Date(order.timeline.find((t) => t.status === step).at).toLocaleString()}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <h3>Items</h3>
        <ul className="summary-items">
          {order.items.map((i) => (
            <li key={i.itemId}>
              <span>{i.name} · {i.color}/{i.size} × {i.qty}</span>
              <span>{formatMoney(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="summary-row total"><span>Total</span><strong>{formatMoney(order.total)}</strong></div>
      </section>
    </div>
  );
}
