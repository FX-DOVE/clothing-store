import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { Loading, ErrorState } from '../components/States.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Backup redirect landing for Paystack callback_url.
 * Reads ?reference= (or ?trxref=) and verifies the payment server-side.
 */
export default function CheckoutCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) {
      setError('Missing payment reference.');
      return;
    }
    if (!user) {
      setError('Please sign in to complete your order, then reopen this link.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const order = await api.verifyPayment({ reference });
        await refresh();
        if (!cancelled) navigate(`/order/${order.id}`, { replace: true });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not verify payment');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, user, authLoading, navigate, refresh]);

  if (error) {
    return (
      <div className="page">
        <ErrorState
          message={error}
          onRetry={() => navigate('/checkout')}
        />
        <p style={{ textAlign: 'center' }}>
          <Link to="/checkout">Back to checkout</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <Loading label="Confirming your Paystack payment…" />
    </div>
  );
}
