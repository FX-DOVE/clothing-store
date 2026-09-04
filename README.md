# Clothing Store (Atelier)

See seed script for admin credentials.

## Quick start

```
npm run install:all
npm run seed
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000

## Accounts

- Admin: admin@atelier.local (password from seed output)
- Demo: demo@atelier.local (password from seed output)

## Features

- Farfetch-style fullscreen PDP gallery
- JWT auth + checkout gate + cart merge
- User dashboard and admin panel
- Wishlist, returns, expenses, mock email
- Paystack payments (cards, bank, USSD, etc.)

## Paystack setup

1. Create API keys in the Paystack dashboard under Settings > Developer.
2. Add them to server/.env (never commit real secrets):

```
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_CURRENCY=NGN
PAYSTACK_CALLBACK_URL=http://localhost:5173/checkout/callback
```

Optional on the client (client/.env): VITE_PAYSTACK_PUBLIC_KEY — otherwise GET /api/payments/config returns the public key.

3. Restart the API. Checkout initializes on the server, opens Paystack Popup with access_code via resumeTransaction, then verifies and creates the order.

### Test cards

Use Paystack test cards from their docs, for example 4084084084084081 for a successful charge. See Paystack test payments documentation for CVV, PIN, and OTP scenarios.

Product prices are treated as NGN major units (naira). Amounts sent to Paystack are multiplied by 100 (kobo).

## Env

JWT_SECRET PORT CLIENT_ORIGIN VITE_API_URL optional SMTP plus Paystack keys above.

MIT
