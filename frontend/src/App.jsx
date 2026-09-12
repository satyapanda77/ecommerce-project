import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { WishlistProvider } from './context/WishlistContext';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import MyAccount from './pages/MyAccount';
import DeliveryDashboard from './pages/DeliveryDashboard';
import NotificationsPage from './pages/NotificationsPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="app-shell">
              <Navbar />
              <main className="app-main">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Customer Routes */}
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                        <MyAccount />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/customer/dashboard" element={<Navigate to="/account" replace />} />

                  {/* Delivery Partner Routes */}
                  <Route
                    path="/delivery/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['DELIVERY_PARTNER', 'ADMIN']}>
                        <DeliveryDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* In-App Notifications Route */}
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Unknown routes fall back to Home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </WishlistProvider>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
