import { Link } from 'react-router-dom';
import { formatMoney } from './States.jsx';

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-card-link">
        <div className="product-card-media">
          <img src={product.images?.[0]} alt="" loading="lazy" />
        </div>
        <div className="product-card-body">
          <p className="eyebrow">{product.category}</p>
          <h3>{product.name}</h3>
          <p className="price">{formatMoney(product.price)}</p>
        </div>
      </Link>
    </article>
  );
}
