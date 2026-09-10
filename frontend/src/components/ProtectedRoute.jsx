import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'CUSTOMER';
    if (!allowedRoles.includes(userRole) && !user?.is_staff) {
      // Gracefully redirect to the appropriate dashboard
      if (userRole === 'DELIVERY_PARTNER') {
        return <Navigate to="/delivery/dashboard" replace />;
      }
      return <Navigate to="/account" replace />;
    }
  }

  return children;
}

