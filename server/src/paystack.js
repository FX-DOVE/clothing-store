/**
 * Paystack API helpers. Secret key stays server-side only.
 */

const PAYSTACK_BASE = 'https://api.paystack.co';

export function getPaystackConfig() {
  const secretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
  const publicKey = (process.env.PAYSTACK_PUBLIC_KEY || '').trim();
  const currency = (process.env.PAYSTACK_CURRENCY || 'NGN').trim().toUpperCase() || 'NGN';
  const callbackUrl = (process.env.PAYSTACK_CALLBACK_URL || '').trim() || null;
  return { secretKey, publicKey, currency, callbackUrl };
}

export function paystackEnabled() {
  const { secretKey, publicKey } = getPaystackConfig();
  return Boolean(secretKey && publicKey);
}

async function paystackRequest(path, { method = 'GET', body } = {}) {
  const { secretKey } = getPaystackConfig();
  if (!secretKey) {
    const err = new Error('Paystack is not configured. Set PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY.');
    err.status = 503;
    throw err;
  }
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === false) {
    const err = new Error(data.message || `Paystack request failed (${res.status})`);
    err.status = res.status >= 400 ? res.status : 502;
    err.paystack = data;
    throw err;
  }
  return data;
}

/**
 * Initialize a transaction. amountMajor is in major currency units (e.g. Naira);
 * Paystack expects subunits (kobo).
 */
export async function initializeTransaction({
  email,
  amountMajor,
  reference,
  metadata,
  callbackUrl,
  currency,
}) {
  const cfg = getPaystackConfig();
  const amount = Math.round(Number(amountMajor) * 100);
  if (!Number.isFinite(amount) || amount < 1) {
    const err = new Error('Invalid payment amount');
    err.status = 400;
    throw err;
  }
  const payload = {
    email,
    amount,
    reference,
    currency: currency || cfg.currency,
    metadata: metadata || {},
  };
  const cb = callbackUrl || cfg.callbackUrl;
  if (cb) payload.callback_url = cb;

  const result = await paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: payload,
  });
  return result.data;
}

export async function verifyTransaction(reference) {
  if (!reference) {
    const err = new Error('Payment reference is required');
    err.status = 400;
    throw err;
  }
  const result = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
  return result.data;
}
