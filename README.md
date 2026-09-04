# Clothing Store

Mobile-first fashion boutique — React (Vite) + Express monorepo.

Repo: https://github.com/FX-DOVE/clothing-store

## Quick start

From repo root:

```
npm run install:all
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000

Or separately: `npm run dev:server` and `npm run dev:client`.

Seed data: `npm run seed` (also auto-seeds on first API start).

## Architecture

- `client/` — Vite + React SPA (mobile-first CSS)
- `server/` — Express REST API
- Persistence: **lowdb JSON file** at `server/data/db.json` (gitignored)

CORS allows the local Vite origin.

## Features

1. Home with featured products + category entry points
2. Product listing with filters/sort (category, price, size, color)
3. Product detail (images, size/color pickers, add to cart)
4. Cart with badge in header
5. Checkout with shipping + mock payment UI
6. Order confirmation
7. Basic search
8. Express REST API for products, cart, orders
9. Seed/sample data out of the box
10. Loading / empty / error states

## Environment

Copy `server/.env.example` and `client/.env.example`.

| Variable | Default | Where |
|----------|---------|--------|
| PORT | 4000 | server |
| CLIENT_ORIGIN | http://localhost:5173 | server |
| VITE_API_URL | http://localhost:4000/api | client |

Payment is mocked only — no real charges.

## License

MIT — demo project.
