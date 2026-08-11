import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const outOfStock = product.stock <= 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      notify('Please login to add items to your cart.', 'error');
      navigate('/login');
      return;
    }
    try {
      await addToCart(product.id, 1);
      notify(`${product.name} added to cart.`, 'success');
    } catch {
      notify('Could not add item to cart. Please try again.', 'error');
    }
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-image-link">
        <img src={product.image} alt={product.name} className="product-card-image" />
        {outOfStock && <span className="badge badge-out">Out of stock</span>}
      </Link>
      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-footer">
          <span className="product-card-price">${Number(product.price).toFixed(2)}</span>
          <span className="product-card-stock">{product.stock} in stock</span>
        </div>
        <div className="product-card-actions">
          <Link to={`/products/${product.id}`} className="btn btn-outline btn-sm">
            View Details
          </Link>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
