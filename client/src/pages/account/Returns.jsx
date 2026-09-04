import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading, ErrorState, EmptyState } from '../../components/States.jsx';

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [orderItemId, setOrderItemId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, o] = await Promise.all([api.getMyReturns(), api.getMyOrders()]);
      setReturns(r);
      setOrders(o);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedOrder = orders.find((o) => o.id === orderId);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.createReturn({ orderId, orderItemId, reason });
      setReason('');
      setOrderItemId('');
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h2>Returns</h2>
      <section className="panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Request a return</h3>
        <form onSubmit={onSubmit}>
          <label className="field">
            <span>Order</span>
            <select required value={orderId} onChange={(e) => { setOrderId(e.target.value); setOrderItemId(''); }}>
              <option value="">Select order</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.id.slice(0, 8)}… · {o.status}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Item</span>
            <select required value={orderItemId} onChange={(e) => setOrderItemId(e.target.value)} disabled={!selectedOrder}>
              <option value="">Select item</option>
              {(selectedOrder?.items || []).map((i) => (
                <option key={i.itemId} value={i.itemId}>{i.name} · {i.size}/{i.color}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Reason</span>
            <input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Too small, changed mind…" />
          </label>
          {formError && <p className="form-error">{formError}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit return'}</button>
        </form>
      </section>

      {!returns.length ? (
        <EmptyState title="No returns" message="Submitted returns will appear here." />
      ) : (
        <ul className="order-list">
          {returns.map((r) => (
            <li key={r.id} className="panel order-row">
              <div>
                <strong>{r.productName}</strong>
                <p className="muted tiny">{r.reason}</p>
              </div>
              <span className="tiny">{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
