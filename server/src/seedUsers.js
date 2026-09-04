import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/** Build seeded users with hashed passwords (sync for seed scripts). */
export function buildSeedUsers() {
  const now = new Date().toISOString();
  return [
    {
      id: 'u-admin',
      name: 'Admin',
      email: 'admin@atelier.local',
      passwordHash: bcrypt.hashSync('Admin123!', 10),
      role: 'admin',
      createdAt: now,
    },
    {
      id: 'u-demo',
      name: 'Demo User',
      email: 'demo@atelier.local',
      passwordHash: bcrypt.hashSync('Demo123!', 10),
      role: 'customer',
      createdAt: now,
    },
  ];
}

export function newUserId() {
  return uuidv4();
}
