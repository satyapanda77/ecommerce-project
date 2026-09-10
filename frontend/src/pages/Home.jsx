import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { ENDPOINTS } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api
      .get(ENDPOINTS.products)
      .then(({ data }) => {
        if (!ignore) setProducts(data.slice(0, 4));
      })
      .catch(() => {
        if (!ignore) setError('Could not load featured products.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span
            style={{
              display: 'inline-block',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '4px 14px',
              borderRadius: '999px',
              marginBottom: '16px',
            }}
          >
            ⚡ Next-Gen E-Commerce & On-Demand Delivery
          </span>
          <h1>
            Everyday essentials, <span>delivered with precision</span>.
          </h1>
          <p>
            MiniShop connects discerning shoppers with premium gadgets, audio gear, and lifestyle accessories, powered by a dedicated live delivery partner network.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-primary btn-lg">
              🛍️ Explore Collection
            </Link>
            <Link to="/register" state={{ role: 'DELIVERY_PARTNER' }} className="btn btn-outline btn-lg">
              🚚 Join as Delivery Partner
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Highlights Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--color-border)', padding: '24px 20px' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>⚡</div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Rapid Local Dispatch</strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Assigned to nearby delivery partners</span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>🛡️</div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Verified Quality</strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>100% authentic, tested items</span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>📍</div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Live Step Tracking</strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Real-time 6-stage order timeline</span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>🔒</div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Secure Checkout</strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>JWT encrypted auth & safe payments</span>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-heading">
          <h2>Featured Products</h2>
          <p>Hand-picked tech accessories and essentials trending this week.</p>
        </div>

        {loading && <Loading text="Loading featured products..." />}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <Link to="/products" className="btn btn-outline btn-lg">
            View All Products &rarr;
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-heading">
            <h2>How It Works</h2>
            <p>From checkout to your hands in 4 seamless steps.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto 16px', fontSize: '1.2rem' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Select Products</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Browse our curated catalog, filter by category, and add items to your cart.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto 16px', fontSize: '1.2rem' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Place Your Order</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Enter your delivery address and instructions for seamless order routing.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto 16px', fontSize: '1.2rem' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Courier Dispatched</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                A verified delivery partner accepts and picks up your package from the hub.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto 16px', fontSize: '1.2rem' }}>
                4
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Track & Receive</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Follow the live delivery timeline in your dashboard until safely delivered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Portal Cards: Customer vs Delivery Partner */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px' }}>
        <div className="section-heading">
          <h2>Built for Both Shoppers & Couriers</h2>
          <p>Choose your portal to get started today.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Customer Portal Card */}
          <div style={{ background: '#fff', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '2.5rem' }}>🛍️</div>
            <h3 style={{ fontSize: '1.4rem', margin: 0 }}>For Customers</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
              Enjoy honest pricing on top electronics, instant cart checkout, live multi-stage order tracking, and transparent status updates.
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.8 }}>
              <li>Browse categorized genuine products</li>
              <li>Live visual order status timeline</li>
              <li>Direct address & password management</li>
              <li>Instant email security alerts</li>
            </ul>
            <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
              <Link to="/products" className="btn btn-primary btn-block">
                Start Shopping
              </Link>
            </div>
          </div>

          {/* Delivery Partner Portal Card */}
          <div style={{ background: '#fff', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: '2.5rem' }}>🚚</div>
            <h3 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--color-primary)' }}>For Delivery Partners</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
              Join our dispatch network. Access the dedicated courier portal, claim available orders, manage active runs, and monitor your delivery history.
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.8 }}>
              <li>Real-time available order pickup queue</li>
              <li>One-click status progression updates</li>
              <li>Clear destination instructions & customer contact</li>
              <li>Automated delivery earnings tracker</li>
            </ul>
            <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
              <Link to="/register" state={{ role: 'DELIVERY_PARTNER' }} className="btn btn-primary btn-block">
                Apply as Delivery Partner
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

