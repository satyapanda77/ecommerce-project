import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="navbar-logo">
            Mini<span>Shop</span>
          </span>
          <p>Simple, modern shopping for everyday essentials.</p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/account">My Account</Link>
        </div>

        <p className="footer-copy">&copy; {new Date().getFullYear()} MiniShop. All rights reserved.</p>
      </div>
    </footer>
  );
}
