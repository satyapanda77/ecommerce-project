import { useEffect } from 'react';

export default function Notification({ notification, onClose }) {
  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className={`toast toast-${notification.type}`} role="status">
      <span>{notification.message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}
