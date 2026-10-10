# SkillVault - digital product & course platform

Next.js 16 (App Router) + Express + MongoDB, Cloudinary storage, and manual bKash / Nagad / Rocket payments with
no login required to buy.

```
/frontend   Next.js 16, TypeScript, Tailwind 4, React Hook Form, Zod
/backend    Express, TypeScript (strict), Mongoose
/docs       PAYMENTS.md (payment flow, approval, limits)
```

## Local setup
```bash
cd backend && cp .env.example .env     # fill in values
npm install && npm run seed && npm run dev      # http://localhost:5000

cd frontend && cp .env.example .env.local
npm install && npm run dev                       # http://localhost:3000
```
Generate secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` for `JWT_SECRET` and `ENCRYPTION_KEY`.
The browser calls `/api/*` on the frontend origin; Next proxies it to `BACKEND_URL` (keeps the auth cookie first-party).



## How buying works (no login)
Buy Now > checkout (name, email, phone) > payment page (choose bKash/Nagad/Rocket, send money, submit TrxID + your number) >
download page with **View PDF / Download PDF**. The same private link is emailed. See `docs/PAYMENTS.md`.

* **Instant access** (default, switchable): access opens on submit; the order stays *In review* until you approve it in
  Admin > Orders. Reject removes access. Turn it off to require approval first.
* A TrxID can only be used once. Prices come from the database, never from the browser.
* The buyer can optionally create a password on the download page, or later via Forgot password, to log in (needed for course lessons).

## Environment variables
Backend: `BKASH_NUMBER, NAGAD_NUMBER, ROCKET_NUMBER, PORT, NODE_ENV, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, ENCRYPTION_KEY, FRONTEND_URL, TRUST_PROXY_HOPS, COOKIE_SAMESITE, CLOUDINARY_*, EMAIL_*`.
Frontend: `NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_API_URL, BACKEND_URL`.
`ENCRYPTION_KEY` encrypts premium-app passwords and access tokens at rest; changing it breaks existing links and credentials.

## Deployment
* **MongoDB Atlas** for `MONGODB_URI`. Run `npm run seed` once.
* **Backend (Render/Railway):** root `backend`, build `npm install && npm run build`, start `npm start`, set env vars
  (`NODE_ENV=production`, `FRONTEND_URL=https://your-site.vercel.app`). Use `TRUST_PROXY_HOPS=2` when Vercel proxies to Render. Health check `/health`.
* **Frontend (Vercel):** root `frontend`, env `BACKEND_URL=https://your-api.onrender.com`, `NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app`.
* Configure `EMAIL_*` in production: the access link email is how buyers return to their download page.

## Security checklist
- [x] Prices, user ids and order status never come from the client
- [x] TrxIDs unique (index) and orders claimed atomically; approve/reject atomic and audit-logged
- [x] Guest links use a random 192-bit token stored encrypted and compared in constant time
- [x] Revenue counts only admin-approved orders; instant access is provisional and revocable
- [x] Protected files streamed after an access check; storage URL never exposed; download limit/expiry enforced
- [x] HTTP-only cookies, bcrypt (12), Helmet, CORS allowlist, origin check, rate limits, mongo-sanitize, Zod validation
- [x] Admin routes protected by role middleware; secrets encrypted/redacted in logs
- [ ] You: change the seeded admin password, use HTTPS, configure email, restrict MongoDB network access, review *In review* orders daily

## Limits
* The app cannot see your wallet, so approval is a manual check of TrxID/amount against your own statement.
* Account recovery: `/forgot-password` (emailed one-hour reset link) and `/recover` (re-sends a guest's private purchase links to the email on the order). Both need `EMAIL_*` configured and answer identically whether or not the email exists.
* Course modules/lessons are embedded in the Product document. "Cart" is a saved list; each item checks out separately.
