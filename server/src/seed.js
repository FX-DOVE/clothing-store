import { forceSeed } from './db.js';
import { products, categories } from './seedData.js';
import { buildSeedUsers } from './seedUsers.js';

forceSeed(products, categories, buildSeedUsers());
console.log('Seeded admin@ngbabies.com / Admin123! and demo@ngbabies.com / Demo123!');
