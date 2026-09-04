/** Display currency — product prices are treated as NGN major units with Paystack. */
export const DISPLAY_CURRENCY = 'NGN';

export function formatMoney(n, currency = DISPLAY_CURRENCY) {
  const code = (currency || DISPLAY_CURRENCY).toUpperCase();
  try {
    return new Intl.NumberFormat(code === 'NGN' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency: code,
    }).format(n || 0);
  } catch {
    const prefix = code === 'NGN' ? '₦' : `${code} `;
    return `${prefix}${Number(n || 0).toFixed(2)}`;
  }
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
