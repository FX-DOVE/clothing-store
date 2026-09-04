export function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state state-loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="state state-empty">
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <h2>Something went wrong</h2>
      <p>{message || 'Please try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
