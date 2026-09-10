import axios from 'axios';

// Single place for the API base URL and all endpoint paths.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const ENDPOINTS = {
  register: '/register/',
  login: '/login/',
  profile: '/profile/',
  changePassword: '/change-password/',
  products: '/products/',
  categories: '/products/categories/',
  productDetail: (id) => `/products/${id}/`,
  cart: '/cart/',
  orders: '/orders/',
  orderDetail: (id) => `/orders/${id}/`,
  cancelOrder: (id) => `/orders/${id}/cancel/`,
  availableDeliveries: '/orders/available-deliveries/',
  myDeliveries: '/orders/my-deliveries/',
  acceptDelivery: (id) => `/orders/${id}/accept/`,
  updateDeliveryStatus: (id) => `/orders/${id}/status/`,
  notifications: '/notifications/',
  notificationRead: (id) => `/notifications/${id}/read/`,
  notificationReadAll: '/notifications/read-all/',
};

const ACCESS_TOKEN_KEY = 'minishop_access_token';
const REFRESH_TOKEN_KEY = 'minishop_refresh_token';
const USER_KEY = 'minishop_user';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  save: ({ access, refresh, user }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT access token to every authenticated request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the access token is invalid/expired, clear auth and send the user to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && tokenStorage.getAccess()) {
      tokenStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
