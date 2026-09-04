const API_URL = import.meta.env.VITE_API_URL || '/api';
const CART_KEY = 'atelier_cart_id';
const TOKEN_KEY = 'atelier_token';

export function getCartId() {
  let id = localStorage.getItem(CART_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CART_KEY, id);
  }
  return id;
}

export function setCartId(id) {
  if (id) localStorage.setItem(CART_KEY, id);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-cart-id': getCartId(),
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getProducts: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const q = qs.toString();
    return request(`/products${q ? `?${q}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  getCategories: () => request('/categories'),
  getCart: () => request('/cart'),
  addToCart: (body) => request('/cart/items', { method: 'POST', body: JSON.stringify(body) }),
  updateCartItem: (itemId, qty) =>
    request(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ qty }) }),
  removeCartItem: (itemId) => request(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getOrder: (id) => request(`/orders/${id}`),

  getPaymentConfig: () => request('/payments/config'),
  initializePayment: (body) =>
    request('/payments/initialize', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (body) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),

  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  getMyOrders: () => request('/me/orders'),
  getMyOrder: (id) => request(`/me/orders/${id}`),
  getMyPurchases: () => request('/me/purchases'),
  getMyReturns: () => request('/me/returns'),
  createReturn: (body) => request('/me/returns', { method: 'POST', body: JSON.stringify(body) }),
  getWishlist: () => request('/me/wishlist'),
  addWishlist: (productId) =>
    request('/me/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),
  removeWishlist: (productId) => request(`/me/wishlist/${productId}`, { method: 'DELETE' }),

  adminStats: () => request('/admin/stats'),
  adminProducts: () => request('/admin/products'),
  adminCreateProduct: (body) =>
    request('/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateProduct: (id, body) =>
    request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  adminOrders: () => request('/admin/orders'),
  adminUpdateOrder: (id, body) =>
    request(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminExpenses: () => request('/admin/expenses'),
  adminCreateExpense: (body) =>
    request('/admin/expenses', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateExpense: (id, body) =>
    request(`/admin/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteExpense: (id) => request(`/admin/expenses/${id}`, { method: 'DELETE' }),
  adminEmails: () => request('/admin/emails'),
  adminSendEmail: (body) =>
    request('/admin/emails', { method: 'POST', body: JSON.stringify(body) }),
};
