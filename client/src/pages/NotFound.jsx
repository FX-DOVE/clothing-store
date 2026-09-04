import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="lede">That page doesn’t exist in this boutique.</p>
      <Link className="btn btn-primary" to="/">Back home</Link>
    </div>
  );
}
