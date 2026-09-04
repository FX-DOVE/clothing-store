import { forceSeed } from './db.js';
import { products, categories } from './seedData.js';
forceSeed(products, categories);
