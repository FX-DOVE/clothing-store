import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/** Inline login/register tabs used at checkout when guest. */
export default function AuthGate({ onSuccess, title = 'Sign in to continue' }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (tab === 'login') await login(email, password);
      else await register(name, email, password);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-gate panel">
      <h2>{title}</h2>
      <p className="muted">Your bag will be saved after you sign in or create an account.</p>
      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
          Sign in
        </button>
        <button type="button" role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
          Create account
        </button>
      </div>
      <form onSubmit={onSubmit}>
        {tab === 'register' && (
          <label className="field">
            <span>Name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Please wait…' : tab === 'login' ? 'Sign in & continue' : 'Create account & continue'}
        </button>
      </form>
    </div>
  );
}
