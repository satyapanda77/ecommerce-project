import { useCallback, useEffect, useState } from 'react';
import api, { ENDPOINTS } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch categories once
  useEffect(() => {
    api
      .get(ENDPOINTS.categories)
      .then(({ data }) => setCategories(data || []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (sortOption) params.sort = sortOption;

      const { data } = await api.get(ENDPOINTS.products, { params });
      let result = data || [];
      if (inStockOnly) {
        result = result.filter((p) => p.stock > 0);
      }
      setProducts(result);
    } catch {
      setError('Could not load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, sortOption, inStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortOption('newest');
    setInStockOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'All' || sortOption !== 'newest' || inStockOnly;

  return (
    <div className="page-container">
      <div className="section-heading">
        <h2>Explore Products</h2>
        <p>Find genuine gadgets and everyday essentials delivered directly to your doorstep.</p>
      </div>

      {/* Filter and Search Bar Control Area */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search products by name or description..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                fontSize: '0.95rem',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Sort by:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: '#fff',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* In-Stock Filter Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--color-text)', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              style={{ width: 'auto' }}
            />
            In-Stock Only
          </label>
        </div>

        {/* Categories Pill Bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginRight: '4px' }}>
            Category:
          </span>
          <button
            type="button"
            className={`btn btn-sm ${selectedCategory === 'All' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '999px', padding: '4px 14px' }}
            onClick={() => setSelectedCategory('All')}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px', padding: '4px 14px' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      {!loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          <span>Showing <strong>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}</span>
        </div>
      )}

      {loading && <Loading text="Loading products catalog..." />}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔎</div>
          <p>No products match your search or filter criteria.</p>
          <button className="btn btn-outline" onClick={clearFilters}>
            Reset All Filters
          </button>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

