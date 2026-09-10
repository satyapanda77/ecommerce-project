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
  const { isAuthenticated, isDeliveryPartner } = useAuth();
  const { addToCart } = useCart();
  const { notify } = useNotification();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

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
      notify('Please login as a customer to add items to your cart.', 'error');
      navigate('/login', { state: { role: 'CUSTOMER' } });
      return;
    }
    if (isDeliveryPartner) {
      notify('Delivery Partner accounts cannot make purchases. Please use a Customer account.', 'error');
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

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      notify('Please login as a customer to buy this item.', 'error');
      navigate('/login', { state: { role: 'CUSTOMER' } });
      return;
    }
    if (isDeliveryPartner) {
      notify('Delivery Partner accounts cannot make purchases.', 'error');
      return;
    }
    setBuyingNow(true);
    try {
      await addToCart(product.id, quantity);
      navigate('/account', { state: { tab: 'cart' } });
    } catch {
      notify('Could not start checkout. Please try again.', 'error');
    } finally {
      setBuyingNow(false);
    }
  };

  if (loading) return <Loading text="Loading product details..." />;

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
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="page-container">
      {/* Breadcrumb Navigation */}
      <nav style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '24px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: 'var(--color-text-muted)' }}>Products</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{product.category}</span>
        <span>/</span>
        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      <div className="product-details">
        <div className="product-details-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-details-info">
          <span className="product-card-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="product-details-price">${Number(product.price).toFixed(2)}</p>

          <p className="product-details-description">{product.description}</p>

          {/* Stock Alert */}
          <div>
            {outOfStock ? (
              <span className="badge badge-out" style={{ position: 'static', padding: '6px 12px', fontSize: '0.82rem' }}>
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                ⚠️ Only {product.stock} items left in stock — order soon!
              </span>
            ) : (
              <p className="product-details-stock">
                ✓ {product.stock} units in stock — Ready for fast dispatch
              </p>
            )}
          </div>

          {!outOfStock && (
            <div className="quantity-selector" style={{ marginTop: '12px' }}>
              <span>Quantity:</span>
              <div className="quantity-controls">
                <button type="button" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  &minus;
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>
                  +
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleAddToCart}
              disabled={outOfStock || adding || buyingNow}
            >
              {adding ? 'Adding...' : '🛒 Add to Cart'}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-lg"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              onClick={handleBuyNow}
              disabled={outOfStock || adding || buyingNow}
            >
              {buyingNow ? 'Redirecting...' : '⚡ Buy Now'}
            </button>
          </div>

          {/* Trust Value Props */}
          <div style={{ marginTop: '28px', borderTop: '1px solid var(--color-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <div>🚚 <strong>Free Standard Delivery</strong> on all orders</div>
            <div>🛡️ <strong>100% Genuine Quality</strong> backed by MiniShop Guarantee</div>
            <div>🔄 <strong>7-Day Easy Returns</strong> & reliable customer assistance</div>
          </div>
        </div>
      </div>
    </div>
  );
}

