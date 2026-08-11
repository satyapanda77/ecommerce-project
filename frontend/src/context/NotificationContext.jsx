import { createContext, useCallback, useContext, useState } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
  }, []);

  const clear = useCallback(() => setNotification(null), []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Notification notification={notification} onClose={clear} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return ctx;
}
