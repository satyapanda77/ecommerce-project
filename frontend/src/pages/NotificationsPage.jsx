import { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, unreadCount } = useNotification();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🔔 Notifications</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Stay updated with your orders, security alerts, and delivery dispatches.
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllAsRead}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      <div className="account-section">
        {loading && notifications.length === 0 ? (
          <div className="loading"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>You have no notifications right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: n.is_read ? '#fff' : '#f5f3ff',
                  borderLeft: n.is_read ? '1px solid var(--color-border)' : '4px solid var(--color-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'background-color 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.98rem' }}>{n.title}</strong>
                    {!n.is_read && (
                      <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '999px' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{n.message}</p>
                  <small style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem', marginTop: '6px', display: 'block' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </small>
                </div>
                {!n.is_read && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    onClick={() => markAsRead(n.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

