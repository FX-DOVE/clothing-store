import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading, ErrorState } from '../../components/States.jsx';

export default function AdminEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ to: '', subject: '', text: '', type: 'marketing', orderId: '' });
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setEmails(await api.adminEmails());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.adminSendEmail(form);
      setForm({ to: '', subject: '', text: '', type: 'marketing', orderId: '' });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h2>Emails</h2>
      <p className="muted">Mock transport (Ethereal or console). Messages are stored in the database.</p>
      <form className="panel" onSubmit={onSubmit} style={{ marginBottom: '1.5rem' }}>
        <label className="field"><span>To</span><input required type="email" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></label>
        <label className="field"><span>Subject</span><input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
        <label className="field"><span>Body</span><input required value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></label>
        <div className="field-row">
          <label className="field">
            <span>Type</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="marketing">marketing</option>
              <option value="order_confirmation">order_confirmation</option>
            </select>
          </label>
          <label className="field"><span>Order ID (optional)</span><input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} /></label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Sending…' : 'Send'}</button>
      </form>
      <ul className="order-list">
        {emails.map((m) => (
          <li key={m.id} className="panel order-row">
            <div>
              <strong>{m.subject}</strong>
              <p className="muted tiny">To {m.to} · {m.type} · {new Date(m.createdAt).toLocaleString()}</p>
              {m.previewUrl && <a className="tiny" href={m.previewUrl} target="_blank" rel="noreferrer">Preview</a>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
