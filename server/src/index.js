import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { getDb, ensureSeeded } from './db.js';
import { products as seedProducts, categories as seedCategories } from './seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

function cartId(req) {
  return req.headers['x-cart-id'] || req.query.cartId || null;
}

function getOrCreateCart(db, id) {
  let cart = db.get('carts').find({ id }).value();
  if (!cart) {
    cart = { id: id || uuidv4(), items: [], updatedAt: new Date().toISOString() };
    db.get('carts').push(cart).write();
  }
  return cart;
}

function enrichCart(db, cart) {
  const items = (cart.items || []).map((item) => {
    const product = db.get('products').find({ id: item.productId }).value();
    const price = product ? product.price : 0;
    return {
      ...item,
      name: product?.name || 'Unknown',
      image: product?.images?.[0] || '',
      price,
      lineTotal: price * item.qty,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return { id: cart.id, items, subtotal, itemCount: items.reduce((s, i) => s + i.qty, 0) };
}

ensureSeeded(seedProducts, seedCategories);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'clothing-store-api' });
});

app.get('/api/categories', (_req, res) => {
  const db = getDb();
  res.json(db.get('categories').value());
});

app.get('/api/products', (req, res) => {
  const db = getDb();
  let list = db.get('products').value().slice();
  const { category, q, minPrice, maxPrice, size, color, sort } = req.query;
  if (category) list = list.filter((p) => p.category === category);
  if (q) {
    const term = String(q).toLowerCase();
    list = list.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }
  if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
  if (size) list = list.filter((p) => p.sizes.includes(size));
  if (color) list = list.filter((p) => p.colors.map((c) => c.toLowerCase()).includes(String(color).toLowerCase()));
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => Number(b.featured) - Number(a.featured));
  res.json(list);
});

app.get('/api/products/:id', (req, res) => {
  const db = getDb();
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.get('/api/cart', (req, res) => {
  const db = getDb();
  const id = cartId(req);
  if (!id) {
    const cart = getOrCreateCart(db, uuidv4());
    return res.json(enrichCart(db, cart));
  }
  const cart = getOrCreateCart(db, id);
  res.json(enrichCart(db, cart));
});

app.post('/api/cart/items', (req, res) => {
  const db = getDb();
  const { productId, size, color, qty = 1 } = req.body || {};
  if (!productId || !size || !color) {
    return res.status(400).json({ error: 'productId, size, and color are required' });
  }
  const product = db.get('products').find({ id: productId }).value();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (!product.sizes.includes(size)) return res.status(400).json({ error: 'Invalid size' });
  if (!product.colors.includes(color)) return res.status(400).json({ error: 'Invalid color' });
  const id = cartId(req) || uuidv4();
  const cart = getOrCreateCart(db, id);
  const existing = cart.items.find((i) => i.productId === productId && i.size === size && i.color === color);
  if (existing) existing.qty += Number(qty) || 1;
  else cart.items.push({ itemId: uuidv4(), productId, size, color, qty: Number(qty) || 1 });
  cart.updatedAt = new Date().toISOString();
  db.get('carts').find({ id: cart.id }).assign(cart).write();
  res.status(201).json(enrichCart(db, cart));
});

app.patch('/api/cart/items/:itemId', (req, res) => {
  const db = getDb();
  const id = cartId(req);
  if (!id) return res.status(400).json({ error: 'Cart id required (x-cart-id)' });
  const cart = db.get('carts').find({ id }).value();
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  const item = cart.items.find((i) => i.itemId === req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const qty = Number(req.body?.qty);
  if (!Number.isFinite(qty) || qty < 1) return res.status(400).json({ error: 'qty must be >= 1' });
  item.qty = qty;
  cart.updatedAt = new Date().toISOString();
  db.get('carts').find({ id }).assign(cart).write();
  res.json(enrichCart(db, cart));
});

app.delete('/api/cart/items/:itemId', (req, res) => {
  const db = getDb();
  const id = cartId(req);
  if (!id) return res.status(400).json({ error: 'Cart id required (x-cart-id)' });
  const cart = db.get('carts').find({ id }).value();
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  cart.items = cart.items.filter((i) => i.itemId !== req.params.itemId);
  cart.updatedAt = new Date().toISOString();
  db.get('carts').find({ id }).assign(cart).write();
  res.json(enrichCart(db, cart));
});

app.delete('/api/cart', (req, res) => {
  const db = getDb();
  const id = cartId(req);
  if (!id) return res.status(400).json({ error: 'Cart id required (x-cart-id)' });
  const cart = db.get('carts').find({ id }).value();
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  cart.items = [];
  cart.updatedAt = new Date().toISOString();
  db.get('carts').find({ id }).assign(cart).write();
  res.json(enrichCart(db, cart));
});

app.post('/api/orders', (req, res) => {
  const db = getDb();
  const id = cartId(req);
  if (!id) return res.status(400).json({ error: 'Cart id required (x-cart-id)' });
  const cart = db.get('carts').find({ id }).value();
  if (!cart || !cart.items.length) return res.status(400).json({ error: 'Cart is empty' });
  const { shipping, payment } = req.body || {};
  if (!shipping?.fullName || !shipping?.email || !shipping?.address || !shipping?.city || !shipping?.postalCode || !shipping?.country) {
    return res.status(400).json({ error: 'Complete shipping details are required' });
  }
  if (!payment?.cardName || !payment?.cardNumber || !payment?.expiry || !payment?.cvc) {
    return res.status(400).json({ error: 'Complete payment details are required (mock)' });
  }
  const enriched = enrichCart(db, cart);
  const shippingFee = enriched.subtotal >= 100 ? 0 : 8.5;
  const tax = Math.round(enriched.subtotal * 0.08 * 100) / 100;
  const order = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    items: enriched.items,
    subtotal: enriched.subtotal,
    shippingFee,
    tax,
    total: Math.round((enriched.subtotal + shippingFee + tax) * 100) / 100,
    shipping,
    payment: {
      method: 'card',
      last4: String(payment.cardNumber).replace(/\s/g, '').slice(-4),
      cardName: payment.cardName,
      mock: true,
      note: 'Demo only — no real charge was made.',
    },
  };
  db.get('orders').push(order).write();
  cart.items = [];
  cart.updatedAt = new Date().toISOString();
  db.get('carts').find({ id }).assign(cart).write();
  res.status(201).json(order);
});

app.get('/api/orders/:id', (req, res) => {
  const db = getDb();
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Clothing Store API listening on http://localhost:${PORT}`);
});
