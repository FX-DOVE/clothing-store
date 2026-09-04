import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, formatMoney } from '../components/States.jsx';
import AuthGate from '../components/AuthGate.jsx';

const emptyShip = { fullName: '', email: '', address: '', city: '', postalCode: '', country: 'United States' };
const emptyPay = { cardName: '', cardNumber: '', expiry: '', cvc: '' };

export default function Checkout() {
  const { cart, refresh } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState(emptyShip);
  const [payment, setPayment] = useState(emptyPay);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [authedStep, setAuthedStep] = useState(Boolean(user));

  useEffect(() => {
    setAuthedStep(Boolean(user));
  }, [user]);

  useEffect(() => {
    if (user) {
      setShipping((s) => ({
        ...s,
        fullName: s.fullName || user.name || '',
        email: s.email || user.email || '',
      }));
    }
  }, [user]);

  if (!cart.items?.length) {
    return (
      <div className="page">
        <EmptyState title="Your bag is empty" message="Add items before checking out." action={<Link className="btn btn-primary" to="/shop">Shop</Link>} />
      </div>
    );
  }

  const shippingFee = cart.subtotal >= 100 ? 0 : 8.5;
  const tax = Math.round(cart.subtotal * 0.08 * 100) / 100;
  const total = Math.round((cart.subtotal + shippingFee + tax) * 100) / 100;

  const onShip = (e) => setShipping((s) => ({ ...s, [e.target.name]: e.target.value }));
  const onPay = (e) => setPayment((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to place your order.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const order = await api.createOrder({ shipping, payment });
      await refresh();
      navigate(`/order/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page checkout-page">
      <h1>Checkout</h1>
      <div className="demo-banner" role="note">
        <strong>Demo payment only.</strong> No real card is charged. Use any test details (e.g. 4242 4242 4242 4242).
      </div>

      {!user || !authedStep ? (
        <AuthGate title="Create account or sign in to checkout" onSuccess={() => setAuthedStep(true)} />
      ) : (
        <form className="checkout-grid" onSubmit={onSubmit}>
          <div className="checkout-forms">
            <section className="panel">
              <h2>Shipping</h2>
              <label className="field"><span>Full name</span><input required name="fullName" value={shipping.fullName} onChange={onShip} autoComplete="name" /></label>
              <label className="field"><span>Email</span><input required type="email" name="email" value={shipping.email} onChange={onShip} autoComplete="email" /></label>
              <label className="field"><span>Address</span><input required name="address" value={shipping.address} onChange={onShip} autoComplete="street-address" /></label>
              <div className="field-row">
                <label className="field"><span>City</span><input required name="city" value={shipping.city} onChange={onShip} autoComplete="address-level2" /></label>
                <label className="field"><span>Postal code</span><input required name="postalCode" value={shipping.postalCode} onChange={onShip} autoComplete="postal-code" /></label>
              </div>
              <label className="field"><span>Country</span><input required name="country" value={shipping.country} onChange={onShip} autoComplete="country-name" /></label>
            </section>
            <section className="panel">
              <h2>Payment</h2>
              <label className="field"><span>Name on card</span><input required name="cardName" value={payment.cardName} onChange={onPay} autoComplete="cc-name" /></label>
              <label className="field"><span>Card number</span><input required name="cardNumber" value={payment.cardNumber} onChange={onPay} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" /></label>
              <div className="field-row">
                <label className="field"><span>Expiry</span><input required name="expiry" value={payment.expiry} onChange={onPay} placeholder="MM/YY" autoComplete="cc-exp" /></label>
                <label className="field"><span>CVC</span><input required name="cvc" value={payment.cvc} onChange={onPay} inputMode="numeric" autoComplete="cc-csc" /></label>
              </div>
            </section>
          </div>
          <aside className="panel checkout-summary">
            <h2>Order summary</h2>
            <ul className="summary-items">
              {cart.items.map((i) => (
                <li key={i.itemId}><span>{i.name} × {i.qty}</span><span>{formatMoney(i.lineTotal)}</span></li>
              ))}
            </ul>
            <div className="summary-row"><span>Subtotal</span><span>{formatMoney(cart.subtotal)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shippingFee === 0 ? 'Free' : formatMoney(shippingFee)}</span></div>
            <div className="summary-row"><span>Tax (est.)</span><span>{formatMoney(tax)}</span></div>
            <div className="summary-row total"><span>Total</span><strong>{formatMoney(total)}</strong></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'}</button>
            <Link className="btn btn-ghost btn-block" to="/cart">Back to bag</Link>
          </aside>
        </form>
      )}
    </div>
  );
}
