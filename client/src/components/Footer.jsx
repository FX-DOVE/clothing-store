import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="footer-brand">NG BABIES</p>
          <p className="muted">Soft cotton baby clothes, rompers, and sets for newborns and toddlers, with nationwide delivery in Nigeria.</p>
        </div>
        <div className="footer-links">
          <Link to="/shop">Shop collection</Link>
          <Link to="/shop?category=outerwear">Knitwear</Link>
          <Link to="/cart">Bag</Link>
        </div>
        <p className="muted tiny">NG BABIES — baby clothes in Nigeria. Pay securely with Paystack.</p>
      </div>
    </footer>
  );
}
