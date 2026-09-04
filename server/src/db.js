import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync(dbPath);
const db = low(adapter);

db.defaults({
  products: [],
  categories: [],
  carts: [],
  orders: [],
  payments: [],
  users: [],
  returns: [],
  expenses: [],
  wishlists: {},
  sentEmails: [],
}).write();

export function getDb() {
  return db;
}

export function ensureSeeded(products, categories, seedUsers = []) {
  const current = db.get('products').value();
  if (!current || current.length === 0) {
    db.set('products', products).write();
    db.set('categories', categories).write();
  }
  const users = db.get('users').value() || [];
  if (users.length === 0 && seedUsers.length) {
    db.set('users', seedUsers).write();
  }
  // Ensure newer collections exist on older db files
  if (!db.has('returns').value()) db.set('returns', []).write();
  if (!db.has('expenses').value()) db.set('expenses', []).write();
  if (!db.has('wishlists').value()) db.set('wishlists', {}).write();
  if (!db.has('sentEmails').value()) db.set('sentEmails', []).write();
  if (!db.has('payments').value()) db.set('payments', []).write();
  if (!db.has('users').value()) db.set('users', seedUsers).write();
}

export function forceSeed(products, categories, seedUsers = []) {
  db.set('products', products).write();
  db.set('categories', categories).write();
  db.set('carts', []).write();
  db.set('orders', []).write();
  db.set('payments', []).write();
  db.set('users', seedUsers).write();
  db.set('returns', []).write();
  db.set('expenses', []).write();
  db.set('wishlists', {}).write();
  db.set('sentEmails', []).write();
  console.log('Force-seeded database at', dbPath);
}
