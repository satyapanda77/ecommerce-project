import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { ENDPOINTS } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api
      .get(ENDPOINTS.products)
      .then(({ data }) => {
        if (!ignore) setProducts(data.slice(0, 4));
      })
      .catch(() => {
        if (!ignore) setError('Could not load featured products.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <h1>
            Everyday essentials, <span>delivered simply</span>.
          </h1>
          <p>
            MiniShop brings you quality gadgets and accessories at honest prices —
            no clutter, no fuss, just great products.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-heading">
          <h2>Featured Products</h2>
          <p>A few of our customers&apos; favorites.</p>
        </div>

        {loading && <Loading text="Loading featured products..." />}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
