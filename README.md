# FundiPro — Full-Stack Web Application

The complete working implementation of the FundiPro platform, built from the **Redesigned Model**
(flat Free / Pro / Business tiers, no commission). Three dashboards, end to end:

1. **Public Storefront** — the free marketing page every fundi gets, with WhatsApp contact, catalogue, and reviews
2. **Fundi Dashboard** — cost calculator, job history, storefront editor, client manager (Business tier), billing
3. **Admin Dashboard** — platform analytics, fundi list, support tickets

## Stack

| Layer    | Tech                                                                 |
|----------|-----------------------------------------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS + React Router                        |
| Backend  | Node.js + Express + JSON file store (`server/db/data.json`)          |
| Auth     | JWT (30-day expiry) + bcrypt password hashing                        |
| Payments | Simulated M-Pesa STK Push (90% success rate, 3s delay) — see below   |

The backend uses a JSON file store instead of a real database **on purpose**: the `store.js`
module exposes the same `insert / update / get / all` shape you'd want from a real ORM, so
swapping it for **Cloudflare D1** later is a contained change — only `server/db/store.js`
needs to be rewritten to use D1's `prepare().bind().run()` API. Nothing in the routes changes.

## Project structure

```
fundipro-app/
├── server/                  Express API (port 4000)
│   ├── config.js            Pricing tiers — single source of truth
│   ├── server.js            App entry point
│   ├── db/
│   │   ├── store.js         JSON file store (swap for D1 here)
│   │   ├── seed.js          Demo data generator
│   │   └── data.json        The "database" (gitignored after first run)
│   ├── middleware/auth.js   JWT verification + tier-gating helpers
│   └── routes/              auth, users, jobs, clients, storefront, payments, admin
└── client/                  React app (port 5173)
    └── src/
        ├── pages/            Landing, Login, Signup, Storefront (public)
        ├── pages/fundi/      Dashboard, Jobs, StorefrontEditor, Clients, Billing, Support
        ├── pages/admin/      AdminOverview, AdminFundis, AdminSupport
        ├── components/       AppShell, PublicNavbar, ProtectedRoute, ui.jsx
        └── context/          AuthContext
```

## Running it locally

You need two terminals (or use the root convenience script below).

```bash
# Terminal 1 — backend
cd server
npm install
npm run seed     # creates server/db/data.json with demo accounts
npm run dev      # http://localhost:4000

# Terminal 2 — frontend
cd client
npm install
npm run dev      # http://localhost:5173 (proxies /api to :4000)
```

Open **http://localhost:5173**.

### Demo accounts (created by `npm run seed`)

| Role        | Phone        | Password   | Notes                              |
|-------------|--------------|------------|-------------------------------------|
| Admin       | 0700000000   | admin123   | Full platform analytics             |
| Pro fundi   | 0711111111   | fundi123   | John Mose — storefront live at `/s/john-mose` |
| Free fundi  | 0733333333   | fundi123   | Peter Ondieki — hits the 3-job cap  |

Three more seeded fundis (Grace, Mary, Samuel) fill out the admin analytics view.

## What's real vs. simulated

| Feature              | Status                                                                 |
|-----------------------|------------------------------------------------------------------------|
| Auth, JWT, bcrypt      | Real                                                                   |
| Tier gating (3-job cap, storefront lock, client-mgmt lock) | Real, enforced server-side                        |
| Cost/profit calculator | Real                                                                  |
| Public storefront, reviews, catalogue | Real                                                  |
| Admin analytics (MRR, by-trade, by-location) | Real, computed from actual records             |
| M-Pesa STK Push        | **Simulated** — `server/routes/payments.js` creates a pending payment, waits 3s, resolves 90% success. This is exactly where a real Safaricom Daraja callback handler plugs in. |
| SMS reminders          | **Stubbed** — Business tier flag exists; no real Africa's Talking call wired up yet |

## Going live: what you'd need to add

1. **Cloudflare D1** — rewrite `server/db/store.js` against D1's SQL API (schema is already implicit in the JSON shapes — see each route file for the fields used)
2. **M-Pesa Daraja credentials** — replace the `setTimeout` simulation in `routes/payments.js` with a real STK Push request + callback URL registered with Safaricom
3. **Africa's Talking API key** — wire up real SMS sending for Business-tier reminders
4. **Deploy** — frontend to Cloudflare Pages (`npm run build` in `client/`), backend to Cloudflare Workers (after the D1 migration) or a small VPS if you want to keep Express as-is

## Environment variables (server)

Copy `server/.env.example` to `server/.env`:

```
JWT_SECRET=change-this-to-something-long-and-random
PORT=4000
```

## Notes on the pricing model

This app implements the **fixed** model from the Redesigned Model doc — flat subscriptions only,
no commission on self-reported profit. See `server/config.js` for the tier definitions; it's the
single source of truth referenced by both the gating middleware and the frontend's tier badges.
