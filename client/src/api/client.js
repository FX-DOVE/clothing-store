const API_URL = import.meta.env.VITE_API_URL || '/api';
const CART_KEY = 'atelier_cart_id';

export function getCartId() {
  let id = localStorage.getItem(CART_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CART_KEY, id);
  }
  return id;
}

export function setCartId(id) {
  localStorage.setItem(CART_KEY, id);
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-cart-id': getCartId(),
    ...(options.headers || {}),
  };
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
};
