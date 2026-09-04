import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { Loading, EmptyState, ErrorState, formatMoney } from '../components/States.jsx';

export default function Cart() {
  const { cart, loading, error, refresh, updateQty, removeItem } = useCart();

  if (loading) return <Loading label="Loading cart…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  if (!cart.items?.length) {
    return (
      <div className="page">
        <EmptyState
          title="Your shopping bag is empty"
          message="Browse the collection and add something you love."
          action={<Link className="btn btn-primary" to="/shop">Continue shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page cart-page">
      <h1>Shopping bag</h1>
      <ul className="cart-list">
        {cart.items.map((item) => (
          <li key={item.itemId} className="cart-item">
            <img src={item.image} alt="" />
            <div className="cart-item-info">
              <Link to={`/product/${item.productId}`}><strong>{item.name}</strong></Link>
              <p className="muted">{item.color} · {item.size}</p>
              <p>{formatMoney(item.price)}</p>
              <div className="cart-item-actions">
                <label>
                  <span className="sr-only">Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateQty(item.itemId, Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
                <button type="button" className="btn btn-ghost" onClick={() => removeItem(item.itemId)}>Remove</button>
              </div>
            </div>
            <p className="cart-line-total">{formatMoney(item.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{formatMoney(cart.subtotal)}</strong>
        </div>
        <p className="muted tiny">Shipping & tax calculated at checkout.</p>
        <Link className="btn btn-primary btn-block" to="/checkout">Checkout</Link>
        <Link className="btn btn-secondary btn-block" to="/shop">Continue shopping</Link>
      </div>
    </div>
  );
}
