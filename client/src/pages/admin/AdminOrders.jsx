import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading, ErrorState, formatMoney } from '../../components/States.jsx';

const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

function draftFromOrder(order) {
  return {
    status: order.status || 'placed',
    trackingNumber: order.trackingNumber || '',
    carrier: order.carrier || 'NG BABIES delivery',
  };
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState('');
  const [saveError, setSaveError] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.adminOrders();
      setOrders(list);
      setDrafts(Object.fromEntries(list.map((order) => [order.id, draftFromOrder(order)])));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateDraft = (id, key, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [key]: value },
    }));
  };

  const onSave = async (id) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setSaveError('');
    try {
      await api.adminUpdateOrder(id, {
        status: draft.status,
        trackingNumber: draft.trackingNumber.trim(),
        carrier: draft.carrier.trim(),
      });
      await load();
    } catch (e) {
      setSaveError(e.message || 'Could not save order');
    } finally {
      setSavingId('');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h2>Orders</h2>
      {saveError && <p className="form-error" role="alert">{saveError}</p>}
      <ul className="order-list">
        {orders.map((order) => {
          const draft = drafts[order.id] || draftFromOrder(order);
          return (
            <li key={order.id} className="panel order-row">
              <div>
                <strong>{order.id.slice(0, 8)}</strong>
                <p className="muted tiny">{new Date(order.createdAt).toLocaleString()} · {formatMoney(order.total)}</p>
                <p className="muted tiny">{order.shipping?.fullName} · {order.shipping?.email}</p>
                <p className="muted tiny">Ships to {order.shipping?.city || 'city not set'}</p>
              </div>
              <div className="field-row" style={{ alignItems: 'end', flexWrap: 'wrap' }}>
                <label className="field" style={{ margin: 0, minWidth: 140 }}>
                  <span>Status</span>
                  <select value={draft.status} onChange={(e) => updateDraft(order.id, 'status', e.target.value)}>
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="field" style={{ margin: 0, minWidth: 180 }}>
                  <span>Tracking number</span>
                  <input
                    value={draft.trackingNumber}
                    onChange={(e) => updateDraft(order.id, 'trackingNumber', e.target.value)}
                    placeholder="Add when available"
                    autoComplete="off"
                  />
                </label>
                <label className="field" style={{ margin: 0, minWidth: 180 }}>
                  <span>Carrier</span>
                  <input
                    value={draft.carrier}
                    onChange={(e) => updateDraft(order.id, 'carrier', e.target.value)}
                    placeholder="NG BABIES delivery"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onSave(order.id)}
                  disabled={savingId === order.id}
                >
                  {savingId === order.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
