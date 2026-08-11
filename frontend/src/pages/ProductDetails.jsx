import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { ENDPOINTS } from '../services/api';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { notify } = useNotification();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    api
      .get(ENDPOINTS.productDetail(id))
      .then(({ data }) => {
        if (!ignore) {
          setProduct(data);
          setQuantity(1);
        }
      })
      .catch(() => {
        if (!ignore) setError('Product not found.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleQuantityChange = (delta) => {
    setQuantity((q) => Math.min(Math.max(1, q + delta), product?.stock || 1));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      notify('Please login to add items to your cart.', 'error');
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      notify(`${quantity} x ${product.name} added to cart.`, 'success');
    } catch {
      notify('Could not add item to cart. Please try again.', 'error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loading text="Loading product..." />;

  if (error || !product) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>{error || 'Product not found.'}</p>
          <Link to="/products" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="page-container">
      <div className="product-details">
        <div className="product-details-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-details-info">
          <span className="product-card-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-details-price">${Number(product.price).toFixed(2)}</p>
          <p className="product-details-description">{product.description}</p>
          <p className={`product-details-stock ${outOfStock ? 'out' : ''}`}>
            {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </p>

          {!outOfStock && (
            <div className="quantity-selector">
              <span>Quantity</span>
              <div className="quantity-controls">
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  &minus;
                </button>
                <span>{quantity}</span>
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>
                  +
                </button>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            onClick={handleAddToCart}
            disabled={outOfStock || adding}
          >
            {adding ? 'Adding...' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
