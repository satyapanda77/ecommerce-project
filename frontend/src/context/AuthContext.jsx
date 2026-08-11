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

  const register = async (username, email, password) => {
    const { data } = await api.post(ENDPOINTS.register, { username, email, password });
    return data;
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
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
