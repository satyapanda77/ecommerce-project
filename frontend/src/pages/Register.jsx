import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(location.state?.role || 'CUSTOMER');
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', form: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) {
      newErrors.username = 'Username is required.';
    } else if (form.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!EMAIL_RE.test(form.email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: role,
        phone_number: form.phone_number.trim(),
        address: form.address.trim(),
      });
      notify('Account created successfully! Please sign in.', 'success');
      navigate('/login', { state: { role } });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: 'Registration failed. Please check your information and try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{role === 'DELIVERY_PARTNER' ? 'Join as Delivery Partner' : 'Create Customer Account'}</h1>
        <p className="auth-subtitle">
          {role === 'DELIVERY_PARTNER'
            ? 'Sign up to start receiving and fulfilling deliveries.'
            : 'Join MiniShop to start shopping with fast & secure delivery.'}
        </p>

        {/* Role Toggle Selector */}
        <div className="role-cards-grid" style={{ marginBottom: '20px' }}>
          <div
            className={`role-select-card ${role === 'CUSTOMER' ? 'active' : ''}`}
            onClick={() => setRole('CUSTOMER')}
          >
            <div className="role-icon-box">🛍️</div>
            <div className="role-title">Customer</div>
            <div className="role-desc">For shoppers</div>
            {role === 'CUSTOMER' && <span className="role-active-badge">✓ Selected</span>}
          </div>

          <div
            className={`role-select-card ${role === 'DELIVERY_PARTNER' ? 'active' : ''}`}
            onClick={() => setRole('DELIVERY_PARTNER')}
          >
            <div className="role-icon-box">🚚</div>
            <div className="role-title">Delivery Partner</div>
            <div className="role-desc">For couriers</div>
            {role === 'DELIVERY_PARTNER' && <span className="role-active-badge">✓ Selected</span>}
          </div>
        </div>

        {errors.form && <div className="form-error-banner">⚠️ {errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              className={errors.username ? 'input-error' : ''}
              placeholder="e.g. alexsmith"
              autoComplete="username"
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              placeholder="alex@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Phone Number (Optional)</label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={form.phone_number}
              onChange={handleChange}
              className={errors.phone_number ? 'input-error' : ''}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
            />
            {errors.phone_number && <span className="field-error">{errors.phone_number}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="address">
              {role === 'DELIVERY_PARTNER' ? 'Operating Hub / City (Optional)' : 'Delivery Address (Optional)'}
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              className={errors.address ? 'input-error' : ''}
              placeholder={role === 'DELIVERY_PARTNER' ? 'Downtown District, North City' : '123 Main St, Apt 4B'}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="input-with-action">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
                placeholder="At least 6 characters"
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? 'Creating Account...' : `Register as ${role === 'DELIVERY_PARTNER' ? 'Delivery Partner' : 'Customer'}`}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" state={{ role }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

