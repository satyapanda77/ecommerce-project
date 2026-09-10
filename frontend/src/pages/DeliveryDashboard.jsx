import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api, { ENDPOINTS } from '../services/api';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const [assignedRes, availRes] = await Promise.all([
        api.get(ENDPOINTS.myDeliveries),
        api.get(ENDPOINTS.availableDeliveries),
      ]);
      setAssignedDeliveries(assignedRes.data || []);
      setAvailableDeliveries(availRes.data || []);
    } catch {
      notify('Failed to load delivery data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);


  const handleAccept = async (orderId) => {
    try {
      await api.post(ENDPOINTS.acceptDelivery(orderId));
      notify(`Accepted Order #${orderId}`, 'success');
      fetchDeliveries();
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to accept delivery.', 'error');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.post(ENDPOINTS.updateDeliveryStatus(orderId), { status: newStatus });
      notify(`Order #${orderId} updated to ${newStatus}`, 'success');
      fetchDeliveries();
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to update status.', 'error');
    }
  };

  const activeDeliveries = assignedDeliveries.filter(
    (d) => !['Delivered', 'Completed', 'Cancelled'].includes(d.status)
  );
  const completedDeliveries = assignedDeliveries.filter(
    (d) => ['Delivered', 'Completed'].includes(d.status)
  );

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🚚 Delivery Partner Portal</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Welcome back, <strong>{user?.username}</strong>! Manage dispatch tasks and active runs.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchDeliveries}>
          🔄 Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Active Deliveries</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>{activeDeliveries.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', borderLeft: '4px solid var(--color-accent)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Available Tasks</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>{availableDeliveries.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Completed Deliveries</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>{completedDeliveries.length}</div>
        </div>
      </div>

      {/* Active Tasks Section */}
      <div className="account-section">
        <h3>🔥 Active Assigned Deliveries ({activeDeliveries.length})</h3>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : activeDeliveries.length === 0 ? (
          <div className="empty-state">
            <p>No active deliveries right now. Check available deliveries below to pick up orders.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Delivery Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDeliveries.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>{order.product?.name} (x{order.quantity})</td>
                    <td>{order.customer_name} {order.customer_phone && `(${order.customer_phone})`}</td>
                    <td style={{ maxWidth: '240px', whiteSpace: 'normal' }}>{order.delivery_address || 'Standard Address'}</td>
                    <td>
                      <span className={`status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {order.status === 'Confirmed' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order.id, 'Preparing')}>
                            Prepare
                          </button>
                        )}
                        {order.status === 'Preparing' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order.id, 'Picked Up')}>
                            Pick Up
                          </button>
                        )}
                        {order.status === 'Picked Up' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order.id, 'Out for Delivery')}>
                            Start Delivery
                          </button>
                        )}
                        {order.status === 'Out for Delivery' && (
                          <button className="btn btn-primary btn-sm" style={{ background: 'var(--color-success)' }} onClick={() => handleStatusUpdate(order.id, 'Delivered')}>
                            ✓ Mark Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Deliveries Queue */}
      <div className="account-section">
        <h3>📦 Available Pickup Queue ({availableDeliveries.length})</h3>
        {availableDeliveries.length === 0 ? (
          <div className="empty-state">
            <p>No pending orders waiting for pickup at the moment.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {availableDeliveries.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>{order.product?.name} (x{order.quantity})</td>
                    <td>{order.customer_name}</td>
                    <td style={{ maxWidth: '240px', whiteSpace: 'normal' }}>{order.delivery_address || 'Address provided'}</td>
                    <td><strong>${order.total_price}</strong></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAccept(order.id)}>
                        Accept Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

