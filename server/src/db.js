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

db.defaults({ products: [], categories: [], carts: [], orders: [] }).write();

export function getDb() {
  return db;
}

export function ensureSeeded(products, categories) {
  const current = db.get('products').value();
  if (!current || current.length === 0) {
    db.set('products', products).write();
    db.set('categories', categories).write();
    console.log('Seeded products and categories into', dbPath);
  }
}

export function forceSeed(products, categories) {
  db.set('products', products).write();
  db.set('categories', categories).write();
  db.set('carts', []).write();
  db.set('orders', []).write();
  console.log('Force-seeded database at', dbPath);
}
