import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="footer-brand">Atelier</p>
          <p className="muted">Modern essentials for everyday style.</p>
        </div>
        <div className="footer-links">
          <Link to="/shop">Shop all</Link>
          <Link to="/shop?category=outerwear">Outerwear</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <p className="muted tiny">Demo store — payments are mocked. No real charges.</p>
      </div>
    </footer>
  );
}
