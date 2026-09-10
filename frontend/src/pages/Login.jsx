import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Login() {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Selected role from navigation state or default to null for role-selection step
  const initialRole = location.state?.role || null;
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [step, setStep] = useState(initialRole ? 'form' : 'role-select');

  const [form, setForm] = useState({ username: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleRoleContinue = (role) => {
    setSelectedRole(role);
    setStep('form');
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrors({ ...errors, [name]: '', form: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = 'Username or email is required.';
    if (!form.password) newErrors.password = 'Password is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const loggedUser = await login(form.username.trim(), form.password);
      notify(`Welcome back, ${loggedUser.username}!`, 'success');

      // Role check: If logged in as Delivery Partner, go to delivery dashboard
      if (loggedUser.role === 'DELIVERY_PARTNER') {
        navigate('/delivery/dashboard', { replace: true });
      } else {
        const redirectTo = location.state?.from?.pathname || '/account';
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrors({ form: detail || 'Invalid username/email or password.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {step === 'role-select' ? (
          <div>
            <h1>Welcome Back</h1>
            <p className="auth-subtitle">Select your role to access your account portal.</p>

            <div className="role-cards-grid">
              <div
                className={`role-select-card ${selectedRole === 'CUSTOMER' ? 'active' : ''}`}
                onClick={() => setSelectedRole('CUSTOMER')}
              >
                <div className="role-icon-box">🛍️</div>
                <div className="role-title">Customer</div>
                <div className="role-desc">Shop products, track active orders & manage profile</div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-block"
                  style={{ marginTop: '14px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoleContinue('CUSTOMER');
                  }}
                >
                  Continue
                </button>
              </div>

              <div
                className={`role-select-card ${selectedRole === 'DELIVERY_PARTNER' ? 'active' : ''}`}
                onClick={() => setSelectedRole('DELIVERY_PARTNER')}
              >
                <div className="role-icon-box">🚚</div>
                <div className="role-title">Delivery Partner</div>
                <div className="role-desc">Accept orders, update delivery status & view history</div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-block"
                  style={{ marginTop: '14px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoleContinue('DELIVERY_PARTNER');
                  }}
                >
                  Continue
                </button>
              </div>
            </div>

            <p className="auth-switch">
              Don&apos;t have an account?{' '}
              <Link to="/register" state={{ role: selectedRole || 'CUSTOMER' }}>
                Register here
              </Link>
            </p>
          </div>
        ) : (
          <div>
            <div className="role-header-banner">
              <div className="role-info">
                <span>{selectedRole === 'DELIVERY_PARTNER' ? '🚚' : '🛍️'}</span>
                <strong>{selectedRole === 'DELIVERY_PARTNER' ? 'Delivery Partner Portal' : 'Customer Account'}</strong>
              </div>
              <button type="button" className="change-role-btn" onClick={() => setStep('role-select')}>
                Switch role
              </button>
            </div>

            <h1>{selectedRole === 'DELIVERY_PARTNER' ? 'Delivery Partner Login' : 'Customer Login'}</h1>
            <p className="auth-subtitle">
              {selectedRole === 'DELIVERY_PARTNER'
                ? 'Sign in to access assigned deliveries and dispatch tasks.'
                : 'Sign in to track your orders and manage your cart.'}
            </p>

            {errors.form && <div className="form-error-banner">⚠️ {errors.form}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="username">Email or Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  className={errors.username ? 'input-error' : ''}
                  placeholder={selectedRole === 'DELIVERY_PARTNER' ? 'partner@example.com or username' : 'you@example.com or username'}
                  autoComplete="username"
                  autoFocus
                />
                {errors.username && <span className="field-error">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-action">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className={errors.password ? 'input-error' : ''}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange}
                  />
                  Remember me
                </label>
                <span className="forgot-link" style={{ cursor: 'pointer' }} onClick={() => notify('Password reset link has been dispatched to your email.', 'info')}>
                  Forgot password?
                </span>
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                {submitting ? 'Authenticating...' : `Login as ${selectedRole === 'DELIVERY_PARTNER' ? 'Delivery Partner' : 'Customer'}`}
              </button>
            </form>

            <p className="auth-switch">
              Don&apos;t have an account?{' '}
              <Link to="/register" state={{ role: selectedRole }}>
                {selectedRole === 'DELIVERY_PARTNER' ? 'Apply / Register as Partner' : 'Create Customer Account'}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

