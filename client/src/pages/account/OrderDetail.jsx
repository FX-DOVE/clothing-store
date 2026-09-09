import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Loading, ErrorState, formatMoney } from '../../components/States.jsx';

const STEPS = [
  { id: 'placed', label: 'Order placed' },
  { id: 'processing', label: 'Preparing your order' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
];

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

  const currentIdx = STEPS.findIndex((step) => step.id === order.status);
  const trackingNumber = (order.trackingNumber || '').trim();

  return (
    <div>
      <p className="tiny"><Link to="/account/orders">Orders</Link></p>
      <h2>Order {order.id.slice(0, 8)}</h2>
      <p className="muted">Status: <strong>{order.status}</strong></p>

      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <h3>Shipment</h3>
        <p className="muted">
          {order.shippingMethod || 'Nationwide delivery'}
          {order.estimatedDelivery ? ` · ${order.estimatedDelivery}` : ''}
        </p>
        <p className="muted">
          Carrier: {order.carrier || 'NG BABIES delivery'}
        </p>
        <p>
          Tracking number:{' '}
          {trackingNumber ? <strong>{trackingNumber}</strong> : 'We will add a tracking number when your parcel is handed over.'}
        </p>
        {order.shipping?.city && (
          <p className="muted">Delivery city: {order.shipping.city}</p>
        )}

        {order.status === 'cancelled' ? (
          <p>This order was cancelled. Contact us from your account if you still need help.</p>
        ) : (
          <ol className="timeline" aria-label="Shipment timeline">
            {STEPS.map((step, i) => {
              const event = order.timeline?.find((entry) => entry.status === step.id);
              return (
                <li key={step.id} className={currentIdx >= i ? 'done' : ''}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{step.label}</strong>
                    {event?.at && (
                      <p className="muted tiny">{new Date(event.at).toLocaleString()}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <h3>Items</h3>
        <ul className="summary-items">
          {order.items.map((item) => (
            <li key={item.itemId}>
              <span>{item.name} · {item.color}/{item.size} × {item.qty}</span>
              <span>{formatMoney(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="summary-row total"><span>Total</span><strong>{formatMoney(order.total)}</strong></div>
      </section>
    </div>
  );
}
