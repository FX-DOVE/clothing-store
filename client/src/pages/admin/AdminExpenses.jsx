import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading, ErrorState, formatMoney } from '../../components/States.jsx';

const empty = { label: '', amount: '', category: 'general', date: '', notes: '' };

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setExpenses(await api.adminExpenses());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    if (editId) await api.adminUpdateExpense(editId, payload);
    else await api.adminCreateExpense(payload);
    setForm(empty);
    setEditId(null);
    await load();
  };

  const onDelete = async (id) => {
    if (!confirm('Delete expense?')) return;
    await api.adminDeleteExpense(id);
    await load();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h2>Expenses</h2>
      <form className="panel" onSubmit={onSubmit} style={{ marginBottom: '1.5rem' }}>
        <h3>{editId ? 'Edit expense' : 'Add expense'}</h3>
        <label className="field"><span>Label</span><input required name="label" value={form.label} onChange={onChange} /></label>
        <div className="field-row">
          <label className="field"><span>Amount</span><input required type="number" step="0.01" name="amount" value={form.amount} onChange={onChange} /></label>
          <label className="field"><span>Category</span><input name="category" value={form.category} onChange={onChange} /></label>
        </div>
        <label className="field"><span>Date</span><input type="date" name="date" value={form.date} onChange={onChange} /></label>
        <label className="field"><span>Notes</span><input name="notes" value={form.notes} onChange={onChange} /></label>
        <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add'}</button>
      </form>
      <ul className="order-list">
        {expenses.map((ex) => (
          <li key={ex.id} className="panel order-row">
            <div>
              <strong>{ex.label}</strong>
              <p className="muted tiny">{ex.category} · {ex.date}</p>
            </div>
            <div className="order-row-meta">
              <span>{formatMoney(ex.amount)}</span>
              <button type="button" className="btn btn-ghost" onClick={() => { setEditId(ex.id); setForm({ label: ex.label, amount: String(ex.amount), category: ex.category, date: ex.date || '', notes: ex.notes || '' }); }}>Edit</button>
              <button type="button" className="btn btn-ghost" onClick={() => onDelete(ex.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
