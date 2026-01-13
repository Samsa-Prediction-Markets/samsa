## Overview
- Integrate Stripe for one‑time payments and recurring subscriptions.
- Keep card data on client only (Stripe Elements). Server creates PaymentIntents and Checkout Sessions; webhooks finalize balances.
- Surface the checkout UI directly inside Dashboard’s “Buying Power” section so users can add funds without leaving the page.

## Current Architecture
- Backend: Node.js/Express (`server.js`) with global `express.json()` and local JSON datastore via `lib/datastore.js`.
- Frontend: Static HTML/JS (`index.html`, `js/features/wallet/wallet-view.js`, `js/core/app.js`), no ES modules.
- Auth: Supabase client; dashboard shown when `Auth.session()` is present (`js/core/app.js:23–27`).
- Buying Power UI: `index.html:433–447`; wallet logic in `js/features/wallet/wallet-view.js` (deposit modal at ~107–139, amount handling at ~60–88).

## 1) SDK & Environment Setup
- Server dependencies: add `stripe` npm package.
- Client: load Stripe v3 via CDN in `index.html` before wallet scripts: `<script src="https://js.stripe.com/v3"></script>`.
- Environment variables (in `.env`):
  - `STRIPE_SECRET_KEY` (test/live)
  - `STRIPE_PUBLISHABLE_KEY` (test/live)
  - `STRIPE_WEBHOOK_SECRET` (from Stripe CLI or Dashboard endpoint)
- Server config: read keys via `process.env` (dotenv already initialized at `server.js:1`).
- Add `.env.example` entries and keep secrets out of version control (already enforced).

## 2) Backend Payment Flow
- Endpoints (Express):
  - `POST /api/payments/create-intent` (JSON body: `userId`, `amount`, `currency`) → create Stripe PaymentIntent, store a pending transaction with `status: 'pending'`, return `client_secret`.
  - `POST /api/payments/create-checkout-session` (JSON body: `userId`, `priceId` or `plan` and optional `quantity`) → create Stripe Checkout Session with `mode: 'subscription'`, return `id`.
  - `POST /api/stripe/webhook` (raw body) → verify signature, handle events:
    - `payment_intent.succeeded`: mark pending deposit completed, credit balance.
    - `payment_intent.payment_failed`: mark pending as failed.
    - `invoice.payment_succeeded`: for subscriptions, credit balance by invoice amount.
- Webhook raw body handling:
  - Mount `/api/stripe/webhook` with `express.raw({ type: 'application/json' })` BEFORE global `express.json()` to preserve signature verification.
- Datastore integration (`lib/datastore.js`):
  - Add helpers to upsert transactions: create pending deposit on intent creation; finalize in webhook; ensure idempotency by checking Stripe IDs.
  - Update `users.json` balance only on webhook success.

## 3) Frontend Checkout (Dashboard Buying Power)
- `index.html`: ensure Stripe script tag is loaded above `wallet-view.js` (near the “Features” block).
- `js/features/wallet/wallet-view.js`:
  - Replace deposit modal content to render Stripe Elements:
    - Initialize `const stripe = Stripe(window.runtimeConfig.STRIPE_PUBLISHABLE_KEY)`.
    - Create `elements = stripe.elements()` and mount `card` element in the modal (e.g., `#card-element`).
  - On “Pay” click:
    - Call `POST /api/payments/create-intent` with selected amount and `currency`.
    - Receive `client_secret` and call `stripe.confirmCardPayment(clientSecret, { payment_method: { card } })`.
    - Show user feedback: processing, success, or error.
  - On success, optimistically refresh wallet UI; real balance is confirmed by webhook and reflected by subsequent fetch to `/api/users/:id/balance`.
- Subscriptions UI:
  - Add a toggle or separate button “Subscribe Monthly” in Buying Power.
  - On click, call `POST /api/payments/create-checkout-session` and redirect via `stripe.redirectToCheckout({ sessionId })`.

## 4) Security & Compliance
- PCI compliance: never send card data to server; use Stripe.js Elements tokenization and PaymentIntent confirmation.
- Amount validation server-side: enforce min/max, allowed currencies, and integer cents.
- Auth coupling: require authenticated user; derive `userId` from session where possible; cross-check against Supabase user in server.
- Idempotency: use Stripe idempotency keys for intent creation; dedupe webhook processing by `event.id`.
- Secrets: keys only in server `.env`; publishable key exposed via a safe runtime config endpoint similar to Supabase config.

## 5) Testing
- Use Stripe test mode keys in `.env`.
- Frontend test cards:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 9995` (insufficient funds), `4000 0000 0000 0341` (lost card)
- Error handling: verify client UI shows clear messages for failed confirmations and declines.
- Webhooks: use Stripe CLI to forward events to `http://localhost:3001/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`; test `payment_intent.succeeded` and `invoice.payment_succeeded`.

## 6) Documentation
- Update `README.md` with:
  - Setup steps (keys, Stripe account objects: Products/Prices for subscriptions).
  - Local testing instructions and common failure modes.
  - Troubleshooting guide (webhook signature errors, raw body parsing, CORS, 3DS handling).

## 7) File Changes (targets)
- `index.html`: add Stripe `<script>` tag near Buying Power/Features scripts (`index.html:433–447 context area`).
- `server.js`:
  - Add webhook route before `express.json()`.
  - Add `/api/payments/create-intent` and `/api/payments/create-checkout-session` routes.
  - Add small runtime config endpoint to expose `STRIPE_PUBLISHABLE_KEY` to client (similar pattern to Supabase at `server.js:31–43`).
- `lib/datastore.js`: add helpers for pending/finalized transactions.
- `js/features/wallet/wallet-view.js`: integrate Stripe Elements into deposit modal and add subscription UI.
- `README.md`: document integration, testing, and troubleshooting.

## 8) Rollout & Backward Compatibility
- Keep existing deposit/withdraw endpoints but deprecate direct balance mutations for deposits; route deposits through Stripe flows.
- Guard by env: if Stripe keys are absent, fall back to current non-Stripe deposit (optional).

## 9) Acceptance Criteria
- Users can add funds via Buying Power modal using Stripe Elements; successful payments update balance via webhook.
- Declines show clear errors; no card data reaches server.
- Subscriptions can be started via Checkout; monthly invoices credit Buying Power.
- Test mode verified for intents and webhooks; documentation complete.
