import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { ENDPOINTS } from '../services/api';
import Loading from '../components/Loading';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

function formatDate(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyAccount() {
  const { items: cartItems, loading: cartLoading, total, fetchCart, removeFromCart } = useCart();
  const { notify } = useNotification();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get(ENDPOINTS.orders);
      setOrders(data);
    } catch {
      notify('Could not load your orders.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await removeFromCart(productId);
      notify('Item removed from cart.', 'success');
    } catch {
      notify('Could not remove item. Please try again.', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      await api.post(ENDPOINTS.orders, {});
      notify('Order placed successfully!', 'success');
      await Promise.all([fetchCart(), fetchOrders()]);
    } catch (err) {
      notify(err.response?.data?.detail || 'Could not place order.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="page-container">
      <div className="section-heading">
        <h2>My Account</h2>
        <p>Manage your cart and review your past orders.</p>
      </div>

      {/* Cart section */}
      <section className="account-section">
        <h3>Cart</h3>

        {cartLoading && <Loading text="Loading your cart..." />}

        {!cartLoading && cartItems.length === 0 && (
          <div className="empty-state">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        )}

        {!cartLoading && cartItems.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td className="cell-product">
                        <img src={item.product.image} alt={item.product.name} />
                        <span>{item.product.name}</span>
                      </td>
                      <td>{item.quantity}</td>
                      <td>${Number(item.product.price).toFixed(2)}</td>
                      <td>${Number(item.subtotal).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleRemove(item.product.id)}
                          disabled={removingId === item.product.id}
                        >
                          {removingId === item.product.id ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cart-summary">
              <span className="cart-total">Total: ${total.toFixed(2)}</span>
              <button className="btn btn-primary btn-lg" onClick={handlePlaceOrder} disabled={placingOrder}>
                {placingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Orders section */}
      <section className="account-section">
        <h3>My Orders</h3>

        {ordersLoading && <Loading text="Loading your orders..." />}

        {!ordersLoading && orders.length === 0 && (
          <div className="empty-state">
            <p>You haven&apos;t placed any orders yet.</p>
          </div>
        )}

        {!ordersLoading && orders.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td className="cell-product">
                      <img src={order.product.image} alt={order.product.name} />
                      <span>{order.product.name}</span>
                    </td>
                    <td>{order.quantity}</td>
                    <td>${Number(order.total_price).toFixed(2)}</td>
                    <td>
                      <span className={`status-pill status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
