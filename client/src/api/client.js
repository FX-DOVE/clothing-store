const API_URL = import.meta.env.VITE_API_URL || '/api';
const CART_KEY = 'ngbabies_cart_id';
const TOKEN_KEY = 'ngbabies_token';

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getCartId() {
  let id = localStorage.getItem(CART_KEY) || localStorage.getItem('atelier_cart_id');
  if (!id) {
    id = generateUUID();
    localStorage.setItem(CART_KEY, id);
  }
  return id;
}

export function setCartId(id) {
  if (id) localStorage.setItem(CART_KEY, id);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('atelier_token');
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('atelier_token');
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('atelier_token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-cart-id': getCartId(),
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const separator = path.includes('?') ? '&' : '?';
  const url = `${API_URL}${path}${separator}_t=${Date.now()}`;
  const res = await fetch(url, { ...options, headers, cache: 'no-store' });
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
