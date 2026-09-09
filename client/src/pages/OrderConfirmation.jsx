import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Loading, ErrorState, formatMoney } from '../components/States.jsx';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await api.getOrder(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Loading label="Loading order…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return null;

  return (
    <div className="page confirm-page">
      <p className="eyebrow">Thank you</p>
      <h1>Order confirmed</h1>
      <p className="lede">Order <code>{order.id}</code> is confirmed. A receipt is sent to {order.shipping?.email}. You can track this shipment from your account.</p>
      <section className="panel">
        <h2>Summary</h2>
        <ul className="summary-items">
          {order.items.map((i) => (
            <li key={i.itemId}><span>{i.name} · {i.color}/{i.size} × {i.qty}</span><span>{formatMoney(i.lineTotal)}</span></li>
          ))}
        </ul>
        <div className="summary-row"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{order.shippingFee === 0 ? 'Free' : formatMoney(order.shippingFee)}</span></div>
        <div className="summary-row"><span>Tax</span><span>{formatMoney(order.tax)}</span></div>
        <div className="summary-row total"><span>Total</span><strong>{formatMoney(order.total)}</strong></div>
        <p className="muted">Ships to {order.shipping.fullName}, {order.shipping.address}, {order.shipping.city}</p>
        {order.payment?.reference && <p className="muted">Payment reference {order.payment.reference}</p>}
      </section>
      <Link className="btn btn-primary" to="/shop">Continue shopping</Link>
    </div>
  );
}
