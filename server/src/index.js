import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { getDb, ensureSeeded } from './db.js';
import { products as seedProducts, categories as seedCategories } from './seedData.js';
import { buildSeedUsers } from './seedUsers.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  publicUser,
  requireAuth,
  requireAdmin,
  optionalAuth,
} from './auth.js';
import { sendAndStoreEmail } from './mail.js';
import {
  getPaystackConfig,
  paystackEnabled,
  initializeTransaction,
  verifyTransaction,
  normalizePaystackEmail,
} from './paystack.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === CLIENT_ORIGIN) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
    origin
  );
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

function cartId(req) {
  return req.headers['x-cart-id'] || req.query.cartId || null;
}

function getOrCreateCart(db, id) {
  let cart = db.get('carts').find({ id }).value();
  if (!cart) {
    cart = { id: id || uuidv4(), items: [], userId: null, updatedAt: new Date().toISOString() };
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
  return {
    id: cart.id,
    userId: cart.userId || null,
    items,
    subtotal,
    itemCount: items.reduce((s, i) => s + i.qty, 0),
  };
}

/** Merge guest cart items into an authenticated user's cart; return the cart to keep using. */
function mergeGuestCartIntoUser(db, guestCartId, userId) {
  if (!guestCartId || !userId) return null;
  const guest = db.get('carts').find({ id: guestCartId }).value();
  let userCart = db.get('carts').find({ userId }).value();
  if (!userCart) {
    if (guest) {
      guest.userId = userId;
      guest.updatedAt = new Date().toISOString();
      db.get('carts').find({ id: guest.id }).assign(guest).write();
      return guest;
    }
    userCart = { id: uuidv4(), items: [], userId, updatedAt: new Date().toISOString() };
    db.get('carts').push(userCart).write();
    return userCart;
  }
  if (guest && guest.id !== userCart.id && guest.items?.length) {
    for (const gItem of guest.items) {
      const existing = userCart.items.find(
        (i) => i.productId === gItem.productId && i.size === gItem.size && i.color === gItem.color
      );
      if (existing) existing.qty += gItem.qty;
      else userCart.items.push({ ...gItem, itemId: gItem.itemId || uuidv4() });
    }
    userCart.updatedAt = new Date().toISOString();
    db.get('carts').find({ id: userCart.id }).assign(userCart).write();
    guest.items = [];
    guest.updatedAt = new Date().toISOString();
    db.get('carts').find({ id: guest.id }).assign(guest).write();
  }
  return userCart;
}

function getWishlistIds(db, userId) {
  const wl = db.get('wishlists').value() || {};
  return wl[userId] || [];
}

function setWishlistIds(db, userId, ids) {
  const wl = db.get('wishlists').value() || {};
  wl[userId] = ids;
  db.set('wishlists', wl).write();
}

ensureSeeded(seedProducts, seedCategories, buildSeedUsers());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'clothing-store-api' });
});

/* ——— Auth ——— */
app.post('/api/auth/register', async (req, res) => {
  try {
    const db = getDb();
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password || String(password).length < 6) {
      return res.status(400).json({ error: 'Name, email, and password (min 6 chars) are required' });
    }
    const normalized = String(email).trim().toLowerCase();
    if (db.get('users').find({ email: normalized }).value()) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = {
      id: uuidv4(),
      name: String(name).trim(),
      email: normalized,
      passwordHash: await hashPassword(password),
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    db.get('users').push(user).write();
    const guestId = cartId(req);
    const cart = mergeGuestCartIntoUser(db, guestId, user.id);
    const token = signToken(user);
    res.status(201).json({
      token,
      user: publicUser(user),
      cartId: cart?.id || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const db = getDb();
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const normalized = String(email).trim().toLowerCase();
    const comEmail = normalized.replace(/\.local$/i, '.com');
    const localEmail = normalized.replace(/\.com$/i, '.local');
    const user = db.get('users').find(
      (u) =>
        u.email === normalized ||
        u.email === comEmail ||
        u.email === localEmail ||
        u.email.replace(/@(ngbabies|atelier)\.(com|local)$/i, '') ===
          normalized.replace(/@(ngbabies|atelier)\.(com|local)$/i, '')
    ).value();
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const guestId = cartId(req);
    const cart = mergeGuestCartIntoUser(db, guestId, user.id);
    const token = signToken(user);
    res.json({
      token,
      user: publicUser(user),
      cartId: cart?.id || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ ok: true });
});

/* ——— Catalog ——— */
app.get('/api/categories', (_req, res) => {
  res.json(getDb().get('categories').value());
});

app.get('/api/products', (req, res) => {
  const db = getDb();
  let list = db.get('products').value().slice();
  const { category, q, minPrice, maxPrice, size, color, sort } = req.query;
  if (category) list = list.filter((p) => p.category === category);
  if (q) {
    const term = String(q).toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term)
    );
  }
  if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
  if (size) list = list.filter((p) => p.sizes.includes(size));
  if (color)
    list = list.filter((p) =>
      p.colors.map((c) => c.toLowerCase()).includes(String(color).toLowerCase())
    );
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => Number(b.featured) - Number(a.featured));
  res.json(list);
});

app.get('/api/products/:id', (req, res) => {
  const product = getDb().get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

/* ——— Cart ——— */
app.get('/api/cart', optionalAuth, (req, res) => {
  const db = getDb();
  let id = cartId(req);
  if (req.user) {
    const userCart = db.get('carts').find({ userId: req.user.id }).value();
    if (userCart) {
      if (id && id !== userCart.id) mergeGuestCartIntoUser(db, id, req.user.id);
      return res.json(enrichCart(db, db.get('carts').find({ userId: req.user.id }).value()));
    }
  }
  if (!id) {
    const cart = getOrCreateCart(db, uuidv4());
    return res.json(enrichCart(db, cart));
  }
  const cart = getOrCreateCart(db, id);
  res.json(enrichCart(db, cart));
});

app.post('/api/cart/items', optionalAuth, (req, res) => {
  const db = getDb();
  const { productId, size, color, qty = 1 } = req.body || {};
  if (!productId || !size || !color) {
    return res.status(400).json({ error: 'productId, size, and color are required' });
  }
  const product = db.get('products').find({ id: productId }).value();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (!product.sizes.includes(size)) return res.status(400).json({ error: 'Invalid size' });
  if (!product.colors.includes(color)) return res.status(400).json({ error: 'Invalid color' });

  let cart;
  if (req.user) {
    cart = db.get('carts').find({ userId: req.user.id }).value();
    if (!cart) {
      const guestId = cartId(req);
      cart = mergeGuestCartIntoUser(db, guestId, req.user.id) || getOrCreateCart(db, uuidv4());
      cart.userId = req.user.id;
      db.get('carts').find({ id: cart.id }).assign(cart).write();
    }
  } else {
    const id = cartId(req) || uuidv4();
    cart = getOrCreateCart(db, id);
  }

  const existing = cart.items.find(
    (i) => i.productId === productId && i.size === size && i.color === color
  );
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

/* ——— Payments (Paystack) ——— */
function validateShipping(shipping) {
  const email = (shipping?.email || '').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return Boolean(
    shipping?.fullName?.trim() &&
      validEmail &&
      shipping?.address?.trim() &&
      shipping?.city?.trim() &&
      shipping?.postalCode?.trim() &&
      shipping?.country?.trim()
  );
}

function loadUserCart(db, req) {
  return (
    db.get('carts').find({ userId: req.user.id }).value() ||
    (cartId(req) ? db.get('carts').find({ id: cartId(req) }).value() : null)
  );
}

function computeOrderAmounts(enriched) {
  const shippingFee = enriched.subtotal >= 100 ? 0 : 8.5;
  const tax = Math.round(enriched.subtotal * 0.08 * 100) / 100;
  const total = Math.round((enriched.subtotal + shippingFee + tax) * 100) / 100;
  return { shippingFee, tax, total, subtotal: enriched.subtotal };
}

function createOrderFromPayment(db, { user, cart, enriched, amounts, shipping, paystackData, reference }) {
  const now = new Date().toISOString();
  const cfg = getPaystackConfig();
  const order = {
    id: uuidv4(),
    userId: user.id,
    createdAt: now,
    status: 'placed',
    timeline: [{ status: 'placed', at: now, note: 'Order placed via Paystack' }],
    items: enriched.items,
    subtotal: amounts.subtotal,
    shippingFee: amounts.shippingFee,
    tax: amounts.tax,
    total: amounts.total,
    shipping,
    shippingMethod: 'Nationwide delivery',
    estimatedDelivery: '3-5 working days',
    trackingNumber: '',
    carrier: 'NG BABIES delivery',
    payment: {
      method: 'paystack',
      reference,
      paidAt: paystackData?.paid_at || now,
      amount: amounts.total,
      currency: cfg.currency,
      channel: paystackData?.channel || null,
      mock: false,
    },
    paymentReference: reference,
  };
  db.get('orders').push(order).write();
  cart.items = [];
  cart.userId = user.id;
  cart.updatedAt = now;
  db.get('carts').find({ id: cart.id }).assign(cart).write();

  const currencySymbol = cfg.currency === 'NGN' ? '₦' : cfg.currency + ' ';
  sendAndStoreEmail({
    to: shipping.email,
    subject: `Order confirmation · ${order.id.slice(0, 8)}`,
    text: `Thank you for your order ${order.id}. Total: ${currencySymbol}${order.total}. Paid via Paystack (${reference}).`,
    html: `<p>Thank you for your order <strong>${order.id}</strong>.</p><p>Total: ${currencySymbol}${order.total}</p><p>Payment reference: ${reference}</p>`,
    type: 'order_confirmation',
    meta: { orderId: order.id, reference },
  }).catch((e) => console.error('email failed', e.message));

  return order;
}

app.get('/api/payments/config', (_req, res) => {
  const { publicKey, currency, secretKey } = getPaystackConfig();
  res.json({
    publicKey: publicKey || '',
    currency,
    enabled: Boolean(secretKey && publicKey),
  });
});

app.post('/api/payments/initialize', requireAuth, async (req, res) => {
  try {
    if (!paystackEnabled()) {
      return res.status(503).json({
        error:
          'Paystack is not configured. Set PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY in the server environment.',
      });
    }
    const db = getDb();
    const { shipping } = req.body || {};
    if (!validateShipping(shipping)) {
      return res.status(400).json({ error: 'Complete shipping details and a valid email are required' });
    }
    const cart = loadUserCart(db, req);
    if (!cart || !cart.items.length) return res.status(400).json({ error: 'Cart is empty' });

    const enriched = enrichCart(db, cart);
    const amounts = computeOrderAmounts(enriched);
    const reference = `atl_${uuidv4().replace(/-/g, '')}`;
    const cfg = getPaystackConfig();
    const originHost = req.headers.origin || CLIENT_ORIGIN;
    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL || `${originHost}/checkout/callback`;

    const pending = {
      id: uuidv4(),
      reference,
      userId: req.user.id,
      cartId: cart.id,
      shipping,
      amounts,
      itemsSnapshot: enriched.items,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.get('payments').push(pending).write();

    const data = await initializeTransaction({
      email: normalizePaystackEmail(shipping.email),
      amountMajor: amounts.total,
      reference,
      callbackUrl,
      metadata: {
        userId: req.user.id,
        cartId: cart.id,
        custom_fields: [
          { display_name: 'Cart ID', variable_name: 'cart_id', value: cart.id },
          { display_name: 'User ID', variable_name: 'user_id', value: req.user.id },
        ],
      },
    });

    res.json({
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      reference: data.reference || reference,
      publicKey: cfg.publicKey,
      amount: amounts.total,
      currency: cfg.currency,
    });
  } catch (err) {
    console.error('payments/initialize', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Failed to initialize payment' });
  }
});

app.post('/api/payments/verify', requireAuth, async (req, res) => {
  try {
    const { reference } = req.body || {};
    if (!reference) return res.status(400).json({ error: 'Payment reference is required' });

    const db = getDb();
    const pending = db.get('payments').find({ reference }).value();
    if (!pending) return res.status(404).json({ error: 'Payment not found' });
    if (pending.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    // Idempotent: order already created for this reference
    const existing = db.get('orders').find({ paymentReference: reference }).value();
    if (existing) return res.json(existing);

    const data = await verifyTransaction(reference);
    if (data.status !== 'success') {
      return res.status(400).json({ error: `Payment not successful (status: ${data.status})` });
    }

    const paidMajor = Number(data.amount) / 100;
    const expected = pending.amounts.total;
    if (Math.abs(paidMajor - expected) > 0.05) {
      console.warn('Paystack amount mismatch', { paidMajor, expected, reference });
    }

    let cart =
      db.get('carts').find({ id: pending.cartId }).value() ||
      loadUserCart(db, req);
    if (!cart) {
      cart = {
        id: pending.cartId || uuidv4(),
        items: [],
        userId: req.user.id,
        updatedAt: new Date().toISOString(),
      };
      db.get('carts').push(cart).write();
    }

    const orderEnriched = {
      items: pending.itemsSnapshot?.length
        ? pending.itemsSnapshot
        : cart.items?.length
          ? enrichCart(db, cart).items
          : [],
      subtotal: pending.amounts.subtotal,
    };
    if (!orderEnriched.items?.length) {
      return res.status(400).json({
        error:
          'Cart no longer available after payment. Contact support with reference: ' + reference,
      });
    }

    const order = createOrderFromPayment(db, {
      user: req.user,
      cart,
      enriched: orderEnriched,
      amounts: pending.amounts,
      shipping: pending.shipping,
      paystackData: data,
      reference,
    });

    db.get('payments')
      .find({ reference })
      .assign({ status: 'paid', paidAt: new Date().toISOString(), orderId: order.id })
      .write();

    res.status(201).json(order);
  } catch (err) {
    console.error('payments/verify', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Failed to verify payment' });
  }
});

/* ——— Orders (auth required) ——— */
/** Mock card checkout disabled — orders are created only via Paystack verify. */
app.post('/api/orders', requireAuth, (_req, res) => {
  res.status(400).json({
    error: 'Direct orders are disabled. Use Paystack checkout via POST /api/payments/initialize.',
  });
});

app.get('/api/orders/:id', optionalAuth, (req, res) => {
  const order = getDb().get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.user && (req.user.role === 'admin' || order.userId === req.user.id)) {
    return res.json(order);
  }
  // Allow confirmation page for recent guest-style lookup if no userId mismatch security needed for demo
  if (!order.userId || (req.user && order.userId === req.user.id)) return res.json(order);
  if (!req.user) return res.json(order); // confirmation page after checkout (token may lag)
  return res.status(403).json({ error: 'Forbidden' });
});

/* ——— Me: orders, purchases, returns, wishlist ——— */
app.get('/api/me/orders', requireAuth, (req, res) => {
  const orders = getDb()
    .get('orders')
    .filter({ userId: req.user.id })
    .value()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

app.get('/api/me/orders/:id', requireAuth, (req, res) => {
  const order = getDb().get('orders').find({ id: req.params.id, userId: req.user.id }).value();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.get('/api/me/purchases', requireAuth, (req, res) => {
  const db = getDb();
  const orders = db.get('orders').filter({ userId: req.user.id }).value();
  const map = new Map();
  for (const order of orders) {
    for (const item of order.items || []) {
      const key = item.productId;
      if (!map.has(key)) {
        const product = db.get('products').find({ id: item.productId }).value();
        map.set(key, {
          productId: item.productId,
          name: item.name,
          image: item.image || product?.images?.[0],
          lastPurchasedAt: order.createdAt,
          timesPurchased: 0,
          totalQty: 0,
        });
      }
      const row = map.get(key);
      row.timesPurchased += 1;
      row.totalQty += item.qty;
      if (new Date(order.createdAt) > new Date(row.lastPurchasedAt)) {
        row.lastPurchasedAt = order.createdAt;
      }
    }
  }
  res.json([...map.values()].sort((a, b) => new Date(b.lastPurchasedAt) - new Date(a.lastPurchasedAt)));
});

app.get('/api/me/returns', requireAuth, (req, res) => {
  const list = getDb()
    .get('returns')
    .filter({ userId: req.user.id })
    .value()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.post('/api/me/returns', requireAuth, (req, res) => {
  const db = getDb();
  const { orderId, orderItemId, reason } = req.body || {};
  if (!orderId || !orderItemId || !reason?.trim()) {
    return res.status(400).json({ error: 'orderId, orderItemId, and reason are required' });
  }
  const order = db.get('orders').find({ id: orderId, userId: req.user.id }).value();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const item = order.items.find((i) => i.itemId === orderItemId);
  if (!item) return res.status(404).json({ error: 'Order item not found' });
  const ret = {
    id: uuidv4(),
    userId: req.user.id,
    orderId,
    orderItemId,
    productId: item.productId,
    productName: item.name,
    reason: String(reason).trim(),
    status: 'requested',
    createdAt: new Date().toISOString(),
  };
  db.get('returns').push(ret).write();
  res.status(201).json(ret);
});

app.get('/api/me/wishlist', requireAuth, (req, res) => {
  const db = getDb();
  const ids = getWishlistIds(db, req.user.id);
  const products = ids
    .map((id) => db.get('products').find({ id }).value())
    .filter(Boolean);
  res.json({ productIds: ids, products });
});

app.post('/api/me/wishlist', requireAuth, (req, res) => {
  const db = getDb();
  const { productId } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'productId required' });
  if (!db.get('products').find({ id: productId }).value()) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const ids = getWishlistIds(db, req.user.id);
  if (!ids.includes(productId)) {
    ids.push(productId);
    setWishlistIds(db, req.user.id, ids);
  }
  res.status(201).json({ productIds: ids });
});

app.delete('/api/me/wishlist/:productId', requireAuth, (req, res) => {
  const db = getDb();
  const ids = getWishlistIds(db, req.user.id).filter((id) => id !== req.params.productId);
  setWishlistIds(db, req.user.id, ids);
  res.json({ productIds: ids });
});

/* ——— Admin ——— */
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const db = getDb();
  const orders = db.get('orders').value() || [];
  const products = db.get('products').value() || [];
  const expenses = db.get('expenses').value() || [];
  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total || 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  res.json({
    revenue: Math.round(revenue * 100) / 100,
    orderCount: orders.length,
    productCount: products.length,
    expenseTotal: Math.round(expenseTotal * 100) / 100,
    userCount: (db.get('users').value() || []).length,
  });
});

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  res.json(getDb().get('products').value());
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const db = getDb();
  const body = req.body || {};
  if (!body.name || body.price == null || !body.category) {
    return res.status(400).json({ error: 'name, price, and category are required' });
  }
  const product = {
    id: body.id || `p-${uuidv4().slice(0, 8)}`,
    name: body.name,
    brand: body.brand || 'NG BABIES',
    category: body.category,
    price: Number(body.price),
    compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : undefined,
    description: body.description || '',
    sizes: body.sizes || ['S', 'M', 'L'],
    colors: body.colors || ['Black'],
    images: body.images?.length ? body.images : [`https://picsum.photos/seed/${Date.now()}/800/1000`],
    featured: Boolean(body.featured),
    newSeason: Boolean(body.newSeason),
    exclusive: Boolean(body.exclusive),
  };
  db.get('products').push(product).write();
  res.status(201).json(product);
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const existing = db.get('products').find({ id: req.params.id }).value();
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const body = req.body || {};
  const updated = {
    ...existing,
    ...body,
    id: existing.id,
    price: body.price != null ? Number(body.price) : existing.price,
    compareAtPrice:
      body.compareAtPrice != null && body.compareAtPrice !== ''
        ? Number(body.compareAtPrice)
        : body.compareAtPrice === ''
          ? undefined
          : existing.compareAtPrice,
  };
  db.get('products').find({ id: existing.id }).assign(updated).write();
  res.json(updated);
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const existing = db.get('products').find({ id: req.params.id }).value();
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.get('products').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const orders = getDb()
    .get('orders')
    .value()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const body = req.body || {};
  const { status } = body;
  const allowed = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  if (Object.prototype.hasOwnProperty.call(body, 'trackingNumber')) {
    order.trackingNumber = String(body.trackingNumber ?? '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, 'carrier')) {
    const nextCarrier = String(body.carrier ?? '').trim();
    order.carrier = nextCarrier || order.carrier || 'NG BABIES delivery';
  }
  if (status === 'shipped') {
    if (!order.trackingNumber) order.trackingNumber = '';
    if (!order.carrier) order.carrier = 'NG BABIES delivery';
  }
  const now = new Date().toISOString();
  order.status = status;
  order.timeline = order.timeline || [];
  const note = order.trackingNumber
    ? `Status updated to ${status}. Tracking ${order.trackingNumber}`
    : `Status updated to ${status}`;
  order.timeline.push({ status, at: now, note });
  db.get('orders').find({ id: order.id }).assign(order).write();
  res.json(order);
});

app.get('/api/admin/expenses', requireAdmin, (_req, res) => {
  const list = getDb()
    .get('expenses')
    .value()
    .slice()
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  res.json(list);
});

app.post('/api/admin/expenses', requireAdmin, (req, res) => {
  const { label, amount, category, date, notes } = req.body || {};
  if (!label || amount == null) return res.status(400).json({ error: 'label and amount required' });
  const expense = {
    id: uuidv4(),
    label: String(label).trim(),
    amount: Number(amount),
    category: category || 'general',
    date: date || new Date().toISOString().slice(0, 10),
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };
  getDb().get('expenses').push(expense).write();
  res.status(201).json(expense);
});

app.put('/api/admin/expenses/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const existing = db.get('expenses').find({ id: req.params.id }).value();
  if (!existing) return res.status(404).json({ error: 'Expense not found' });
  const body = req.body || {};
  const updated = {
    ...existing,
    ...body,
    id: existing.id,
    amount: body.amount != null ? Number(body.amount) : existing.amount,
  };
  db.get('expenses').find({ id: existing.id }).assign(updated).write();
  res.json(updated);
});

app.delete('/api/admin/expenses/:id', requireAdmin, (req, res) => {
  const db = getDb();
  if (!db.get('expenses').find({ id: req.params.id }).value()) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  db.get('expenses').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

app.get('/api/admin/emails', requireAdmin, (_req, res) => {
  const list = getDb()
    .get('sentEmails')
    .value()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.post('/api/admin/emails', requireAdmin, async (req, res) => {
  try {
    const { to, subject, text, html, type, orderId } = req.body || {};
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'to, subject, and text/html are required' });
    }
    let bodyText = text;
    let bodyHtml = html;
    if (type === 'order_confirmation' && orderId) {
      const order = getDb().get('orders').find({ id: orderId }).value();
      if (order) {
        bodyText =
          bodyText ||
          `Order ${order.id} confirmation. Status: ${order.status}. Total: $${order.total}.`;
        bodyHtml =
          bodyHtml ||
          `<p>Order <strong>${order.id}</strong></p><p>Status: ${order.status}</p><p>Total: $${order.total}</p>`;
      }
    }
    const record = await sendAndStoreEmail({
      to,
      subject,
      text: bodyText,
      html: bodyHtml,
      type: type || 'marketing',
      meta: orderId ? { orderId } : {},
    });
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NG BABIES API listening on:`);
  console.log(`  - Local:   http://localhost:${PORT}`);
  console.log(`  - Network: http://192.168.1.125:${PORT}`);
});
