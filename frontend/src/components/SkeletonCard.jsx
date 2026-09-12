/**
 * SkeletonCard — placeholder card shown while products are loading.
 * Uses a CSS pulse animation defined in index.css.
 */
export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image skeleton-pulse" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-pulse" style={{ width: '40%', height: '12px' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '80%', height: '18px', marginTop: '8px' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: '14px', marginTop: '6px' }} />
        <div className="skeleton-actions">
          <div className="skeleton-btn skeleton-pulse" />
          <div className="skeleton-btn skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}
