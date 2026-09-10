import React from 'react';

const STAGES = [
  { key: 'Pending', label: 'Order Placed', desc: 'Order received in system' },
  { key: 'Confirmed', label: 'Confirmed', desc: 'Verified and queued for dispatch' },
  { key: 'Preparing', label: 'Preparing', desc: 'Items packed and labeled' },
  { key: 'Picked Up', label: 'Picked Up', desc: 'Collected by delivery courier' },
  { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Courier en route to address' },
  { key: 'Delivered', label: 'Delivered', desc: 'Handed over at destination' },
];

export default function OrderTrackingModal({ isOpen, order, onClose }) {
  if (!isOpen || !order) return null;

  const isCancelled = order.status === 'Cancelled';
  const currentIndex = STAGES.findIndex((s) => s.key.toLowerCase() === (order.status || '').toLowerCase());
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '560px',
          padding: '32px',
          border: '1px solid var(--color-border)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>📦 Order #{order.id} Tracking</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Placed on {new Date(order.created_at).localeDateTimeString ? new Date(order.created_at).toLocaleString() : order.created_at}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              lineHeight: 1,
            }}
          >
            ❕</button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--color-bg)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
          }}
        >
          <img
            src={order.product?.image}
            alt={order.product?.name}
            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
          />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.95rem' }}>{order.product?.name}</strong>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Qty: {order.quantity} — Total: ${Number(order.total_price).toFixed(2)}
            </div>
          </div>
          <span className={`status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {order.status}
          </span>
        </div>

        {isCancelled ? (
          <div
            style={{
              background: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontWeight: 600,
              marginBottom: '20px',
            }}
          >
            ⚠️ This order has been cancelled.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: '24px' }}>
            {STAGES.map((stage, idx) => {
              const isPassed = idx < activeIdx;
              const isCurrent = idx === activeIdx;
              let dotColor = '#e2e8f0';
              let dotBorder = '#94a3b8';
              let textColor = 'var(--color-text-faint)';
              if (isPassed) {
                dotColor = 'var(--color-success)';
                dotBorder = 'var(--color-success)';
                textColor = 'var(--color-text)';
              } else if (isCurrent) {
                dotColor = 'var(--color-primary)';
                dotBorder = 'var(--color-primary)';
                textColor = 'var(--color-primary)';
              }

              return (
                <div key={stage.key} style={{ display: 'flex', gap: '16px', minHeight: '58px', position: 'relative' }}>
                  {idx < STAGES.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '13px',
                        top: '24px',
                        bottom: '-6px',
                        width: '2px',
                        background: isPassed ? 'var(--color-success)' : '#e2e8f0',
                        zIndex: 1,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isPassed || isCurrent ? dotColor : '#fff',
                      border: `2px solid ${dotBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.75em',
                      fontWeight: 800,
                      zIndex: 2,
                      boxShadow: isCurrent ? '0 0 0 4px var(--color-primary-light)' : 'none',
                    }}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <div style={{ paddingBottom: '16px' }}>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: isCurrent ? 'var(--color-primary)' : textColor }}>
                      {stage.label} {isCurrent && ' (PRIMARY STATUS)' + ' • In Progress'}
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {stage.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Destination Address: </span>
            <strong>{order.delivery_address || 'Customer Primary Address'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Delivery Courier: </span>
            <strong>{order.delivery_partner_name ? `🚚 ${order.delivery_partner_name}` : 'Awaiting partner assignment'}</strong>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
