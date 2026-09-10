import { createContext, useContext, useState } from 'react';
import api, { ENDPOINTS, tokenStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(tokenStorage.getUser());

  const login = async (username, password) => {
    const { data } = await api.post(ENDPOINTS.login, { username, password });
    tokenStorage.save({ access: data.access, refresh: data.refresh, user: data.user });
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    // Accepts object { username, email, password, role, phone_number, address }
    // or legacy (username, email, password)
    const body = typeof payload === 'object' && payload !== null
      ? payload
      : { username: arguments[0], email: arguments[1], password: arguments[2] };

    const { data } = await api.post(ENDPOINTS.register, body);
    return data;
  };

  const updateProfile = async (profileData) => {
    const { data } = await api.put(ENDPOINTS.profile, profileData);
    const updatedUser = data.user;
    tokenStorage.save({
      access: tokenStorage.getAccess(),
      refresh: tokenStorage.getRefresh(),
      user: updatedUser,
    });
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const isCustomer = user?.role === 'CUSTOMER';
  const isDeliveryPartner = user?.role === 'DELIVERY_PARTNER';
  const isAdmin = user?.role === 'ADMIN' || user?.is_staff;

  const value = {
    user,
    isAuthenticated: !!user,
    role: user?.role || null,
    isCustomer,
    isDeliveryPartner,
    isAdmin,
    login,
    register,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

