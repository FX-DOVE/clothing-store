import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, formatMoney } from '../components/States.jsx';
import AuthGate from '../components/AuthGate.jsx';

const emptyShip = {
  fullName: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Nigeria',
};

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }
    const existing = document.querySelector('script[data-paystack-inline]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.PaystackPop));
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    script.dataset.paystackInline = '1';
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
}

export default function Checkout() {
  const { cart, refresh } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState(emptyShip);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [authedStep, setAuthedStep] = useState(Boolean(user));

  useEffect(() => {
    setAuthedStep(Boolean(user));
  }, [user]);

  useEffect(() => {
    if (user) {
      setShipping((s) => ({
        ...s,
        fullName: s.fullName || user.name || '',
        email: s.email || (user.email ? user.email.replace(/\.local$/i, '.com') : ''),
      }));
    }
  }, [user]);

  if (!cart.items?.length) {
    return (
      <div className="page">
        <EmptyState
          title="Your bag is empty"
          message="Add items before checking out."
          action={
            <Link className="btn btn-primary" to="/shop">
              Shop
            </Link>
          }
        />
      </div>
    );
  }

  const shippingFee = cart.subtotal >= 100 ? 0 : 8.5;
  const tax = Math.round(cart.subtotal * 0.08 * 100) / 100;
  const total = Math.round((cart.subtotal + shippingFee + tax) * 100) / 100;

  const onShip = (e) => setShipping((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to place your order.');
      return;
    }
    const trimmedEmail = (shipping.email || '').trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please provide a valid email address.');
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      const init = await api.initializePayment({ shipping });
      const PaystackPop = await loadPaystackScript();
      if (!PaystackPop) throw new Error('Paystack failed to load');

      const popup = new PaystackPop();
      popup.resumeTransaction(init.access_code, {
        onSuccess: async (transaction) => {
          try {
            const reference = transaction?.reference || init.reference;
            const order = await api.verifyPayment({ reference });
            await refresh();
            navigate(`/order/${order.id}`);
          } catch (err) {
            setError(err.message || 'Payment verification failed');
            setSubmitting(false);
          }
        },
        onCancel: () => {
          setInfo('Payment cancelled. You can try again when ready.');
          setSubmitting(false);
        },
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="page checkout-page">
      <h1>Checkout</h1>
      {!user || !authedStep ? (
        <AuthGate title="Create account or sign in to checkout" onSuccess={() => setAuthedStep(true)} />
      ) : (
        <form className="checkout-grid" onSubmit={onSubmit}>
          <div className="checkout-forms">
            <section className="panel">
              <h2>Shipping</h2>
              <label className="field">
                <span>Full name</span>
                <input
                  required
                  name="fullName"
                  value={shipping.fullName}
                  onChange={onShip}
                  autoComplete="name"
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={shipping.email}
                  onChange={onShip}
                  autoComplete="email"
                />
              </label>
              <label className="field">
                <span>Address</span>
                <input
                  required
                  name="address"
                  value={shipping.address}
                  onChange={onShip}
                  autoComplete="street-address"
                />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>City</span>
                  <input
                    required
                    name="city"
                    value={shipping.city}
                    onChange={onShip}
                    autoComplete="address-level2"
                  />
                </label>
                <label className="field">
                  <span>Postal code</span>
                  <input
                    required
                    name="postalCode"
                    value={shipping.postalCode}
                    onChange={onShip}
                    autoComplete="postal-code"
                  />
                </label>
              </div>
              <label className="field">
                <span>Country</span>
                <input
                  required
                  name="country"
                  value={shipping.country}
                  onChange={onShip}
                  autoComplete="country-name"
                />
              </label>
            </section>
            <section className="panel">
              <h2>Payment</h2>
              <p className="muted">
                After you continue, Paystack will open so you can pay securely. No card details are
                entered on this site.
              </p>
            </section>
          </div>
          <aside className="panel checkout-summary">
            <h2>Order summary</h2>
            <ul className="summary-items">
              {cart.items.map((i) => (
                <li key={i.itemId}>
                  <span>
                    {i.name} × {i.qty}
                  </span>
                  <span>{formatMoney(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatMoney(cart.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : formatMoney(shippingFee)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (est.)</span>
              <span>{formatMoney(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className="form-info" role="status">
                {info}
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Opening Paystack…' : 'Pay with Paystack'}
            </button>
            <Link className="btn btn-ghost btn-block" to="/cart">
              Back to bag
            </Link>
          </aside>
        </form>
      )}
    </div>
  );
}
