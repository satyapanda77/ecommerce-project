import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { ENDPOINTS } from '../services/api';
import Loading from '../components/Loading';
import ConfirmationModal from '../components/ConfirmationModal';
import OrderTrackingModal from '../components/OrderTrackingModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyAccount() {
  const { user, updateProfile } = useAuth();
  const { items: cartItems, loading: cartLoading, total, fetchCart, removeFromCart } = useCart();
  const { notify } = useNotification();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'overview');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // Delivery details on checkout
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Modals state
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    address: user?.address || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get(ENDPOINTS.orders);
      setOrders(data || []);
    } catch {
      notify('Could not load your orders.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
      });
      if (!deliveryAddress && user.address) {
        setDeliveryAddress(user.address);
      }
    }
  }, [user]);

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
    if (!deliveryAddress.trim()) {
      notify('Please specify a delivery address before placing order.', 'error');
      return;
    }
    setPlacingOrder(true);
    try {
      await api.post(ENDPOINTS.orders, {
        delivery_address: deliveryAddress.trim(),
        delivery_notes: deliveryNotes.trim(),
      });
      notify('Order placed successfully! Track its delivery in the Orders tab.', 'success');
      setDeliveryNotes('');
      await Promise.all([fetchCart(), fetchOrders()]);
      setActiveTab('orders');
    } catch (err) {
      notify(err.response?.data?.detail || 'Could not place order.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCancelOrderConfirm = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      await api.post(ENDPOINTS.cancelOrder(orderToCancel.id));
      notify(`Order #${orderToCancel.id} has been cancelled.`, 'success');
      setOrderToCancel(null);
      await fetchOrders();
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      notify('Profile details updated successfully.', 'success');
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 6) {
      notify('New password must be at least 6 characters.', 'error');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      notify('New passwords do not match.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await api.post(ENDPOINTS.changePassword, {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      notify('Password changed successfully.', 'success');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to change password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Metrics
  const activeOrders = orders.filter((o) =>
    ['Pending', 'Confirmed', 'Preparing', 'Picked Up', 'Out for Delivery'].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ['Delivered', 'Completed'].includes(o.status)
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Customer Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Welcome back, <strong>{user?.username}</strong>! Manage your cart, track orders & configure settings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/products" className="btn btn-primary btn-sm">
            🛍️ Browse Store
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '28px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`btn ${activeTab === 'cart' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('cart')}
        >
          🛒 My Cart ({cartItems.length})
        </button>
        <button
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders & Tracking ({orders.length})
        </button>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile & Security
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Orders Placed</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '6px' }}>{orders.length}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', borderLeft: '4px solid var(--color-accent)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Active Deliveries</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '6px' }}>{activeOrders.length}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', borderLeft: '4px solid var(--color-success)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Delivered Orders</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '6px' }}>{completedOrders.length}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Items in Cart</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '6px' }}>{cartItems.length}</div>
            </div>
          </div>

          {/* Active Order Spotlight */}
          {activeOrders.length > 0 && (
            <div className="account-section" style={{ border: '2px solid var(--color-primary)', background: '#faf5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔥 Active Order in Transit: #{activeOrders[0].id}
                </h3>
                <button className="btn btn-primary btn-sm" onClick={() => setTrackingOrder(activeOrders[0])}>
                  🔍 Live Status Timeline
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <img
                  src={activeOrders[0].product?.image}
                  alt={activeOrders[0].product?.name}
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{activeOrders[0].product?.name} (x{activeOrders[0].quantity})</h4>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                    Destination: <strong>{activeOrders[0].delivery_address || 'Home Address'}</strong> • Current Status: <span className={`status-pill status-${activeOrders[0].status.toLowerCase().replace(/\s+/g, '-')}`}>{activeOrders[0].status}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Profile Summary */}
          <div className="account-section">
            <h3>👤 Profile & Primary Shipping Info</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.92rem' }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Username:</span> <strong>{user?.username}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Email:</span> <strong>{user?.email}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Phone:</span> <strong>{user?.phone_number || 'Not provided'}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Default Address:</span> <strong>{user?.address || 'Not provided'}</strong></div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: '18px' }}
              onClick={() => setActiveTab('profile')}
            >
              Edit Profile & Shipping Address
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CART & CHECKOUT */}
      {activeTab === 'cart' && (
        <section className="account-section">
          <h3>Shopping Cart & Checkout</h3>

          {cartLoading && <Loading text="Loading your cart..." />}

          {!cartLoading && cartItems.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🛒</div>
              <p>Your shopping cart is currently empty.</p>
              <Link to="/products" className="btn btn-primary">
                Browse Available Products
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
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.id}>
                        <td className="cell-product">
                          <img src={item.product.image} alt={item.product.name} />
                          <div>
                            <strong>{item.product.name}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-faint)' }}>{item.product.category}</div>
                          </div>
                        </td>
                        <td>${Number(item.product.price).toFixed(2)}</td>
                        <td>
                          <strong>{item.quantity}</strong>
                        </td>
                        <td>${Number(item.subtotal).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRemove(item.product.id)}
                            disabled={removingId === item.product.id}
                          >
                            {removingId === item.product.id ? 'Removing...' : '✕ Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Checkout Form Card */}
              <div style={{ marginTop: '28px', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '1.15rem' }}>🚚 Delivery & Checkout Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="deliveryAddress">Delivery Destination Address *</label>
                    <input
                      id="deliveryAddress"
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. 742 Evergreen Terrace, Apt 5B"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="deliveryNotes">Delivery Instructions (Optional)</label>
                    <input
                      id="deliveryNotes"
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="e.g. Leave package by front door / Ring doorbell"
                    />
                  </div>
                </div>

                <div className="cart-summary" style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Standard Fast Delivery: <strong style={{ color: 'var(--color-success)' }}>FREE</strong></div>
                    <div className="cart-total" style={{ marginTop: '4px' }}>Grand Total: ${total.toFixed(2)}</div>
                  </div>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                  >
                    {placingOrder ? 'Processing Order...' : 'Confirm & Place Order'}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* TAB 3: ORDERS & TRACKING */}
      {activeTab === 'orders' && (
        <section className="account-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Order History & Live Tracking</h3>
            <button className="btn btn-outline btn-sm" onClick={fetchOrders}>
              🔄 Refresh Orders
            </button>
          </div>

          {ordersLoading && <Loading text="Loading your orders..." />}

          {!ordersLoading && orders.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📦</div>
              <p>You haven&apos;t placed any orders yet.</p>
              <Link to="/products" className="btn btn-primary">
                Start Shopping
              </Link>
            </div>
          )}

          {!ordersLoading && orders.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const canCancel = ['Pending', 'Confirmed'].includes(order.status);
                    return (
                      <tr key={order.id}>
                        <td><strong>#{order.id}</strong></td>
                        <td className="cell-product">
                          <img src={order.product?.image} alt={order.product?.name} />
                          <div>
                            <strong>{order.product?.name}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                              {order.delivery_partner_name ? `🚚 Courier: ${order.delivery_partner_name}` : 'Awaiting courier'}
                            </div>
                          </div>
                        </td>
                        <td>{order.quantity}</td>
                        <td><strong>${Number(order.total_price).toFixed(2)}</strong></td>
                        <td>
                          <span className={`status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setTrackingOrder(order)}
                            >
                              🔍 Track
                            </button>
                            {canCancel && (
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ borderColor: '#fca5a5', color: 'var(--color-error)' }}
                                onClick={() => setOrderToCancel(order)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: PROFILE & SECURITY */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Profile Form */}
          <div className="account-section">
            <h3>👤 Profile & Shipping Address</h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label>Username (Read-only)</label>
                <input type="text" value={user?.username || ''} disabled style={{ opacity: 0.7 }} />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  id="phone_number"
                  type="tel"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Primary Shipping Address</label>
                <textarea
                  id="address"
                  rows="3"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Enter your default delivery street address, city, and zip code"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Update Profile Details'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="account-section">
            <h3>🔒 Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="old_password">Current Password</label>
                <input
                  id="old_password"
                  type="password"
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password">New Password (min 6 characters)</label>
                <input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirm New Password</label>
                <input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Order Cancellation */}
      <ConfirmationModal
        isOpen={!!orderToCancel}
        title={`Cancel Order #${orderToCancel?.id}?`}
        message={`Are you sure you want to cancel your order for ${orderToCancel?.product?.name}? The item quantity will be returned to inventory.`}
        confirmText="Yes, Cancel Order"
        confirmVariant="danger"
        loading={cancelling}
        onConfirm={handleCancelOrderConfirm}
        onCancel={() => setOrderToCancel(null)}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={!!trackingOrder}
        order={trackingOrder}
        onClose={() => setTrackingOrder(null)}
      />
    </div>
  );
}

