import { forceSeed } from './db.js';
import { products, categories } from './seedData.js';
import { buildSeedUsers } from './seedUsers.js';

forceSeed(products, categories, buildSeedUsers());
console.log('Seeded admin@atelier.local / Admin123! and demo@atelier.local / Demo123!');
