import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="lede">That page is not part of the NG BABIES store.</p>
      <Link className="btn btn-primary" to="/">Back to NG BABIES</Link>
    </div>
  );
}
