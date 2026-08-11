import { useEffect, useState } from 'react';
import api, { ENDPOINTS } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api
      .get(ENDPOINTS.products)
      .then(({ data }) => {
        if (!ignore) setProducts(data);
      })
      .catch(() => {
        if (!ignore) setError('Could not load products. Please try again later.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="page-container">
      <div className="section-heading">
        <h2>All Products</h2>
        <p>Browse our full collection.</p>
      </div>

      {loading && <Loading text="Loading products..." />}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <p>No products available right now. Please check back later.</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
