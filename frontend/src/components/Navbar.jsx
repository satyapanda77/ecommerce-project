import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

export default function Navbar() {
  const { isAuthenticated, user, isDeliveryPartner, logout } = useAuth();
  const { itemCount } = useCart();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          Mini<span>Shop</span>
        </Link>

        <nav className="navbar-links">
          {/* General navigation */}
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>

          {!isDeliveryPartner && (
            <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
              Products
            </NavLink>
          )}

          {/* Customer Navigation */}
          {isAuthenticated && !isDeliveryPartner && (
            <NavLink to="/account" className={({ isActive }) => (isActive ? 'active' : '')}>
              My Account
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </NavLink>
          )}

          {/* Delivery Partner Navigation */}
          {isAuthenticated && isDeliveryPartner && (
            <NavLink to="/delivery/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              🚚 Delivery Portal
            </NavLink>
          )}

          {/* Notifications link for all authenticated users */}
          {isAuthenticated && (
            <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'active' : '')}>
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="cart-badge" style={{ background: 'var(--color-primary)' }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          )}
        </nav>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="navbar-user">
                  Hi, <strong>{user.username}</strong>
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isDeliveryPartner ? '#fef3c7' : 'var(--color-primary-light)',
                    color: isDeliveryPartner ? '#b45309' : 'var(--color-primary)',
                  }}
                >
                  {isDeliveryPartner ? 'Delivery Partner' : 'Customer'}
                </span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

