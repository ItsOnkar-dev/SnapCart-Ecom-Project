<div align="center">

# ⚙️ SnapCart — Backend

### Production-grade REST API for a multi-vendor e-commerce platform

_Node.js · Express 5 · TypeScript · MongoDB · JWT · Cloudinary · Resend · Razorpay_

<br/>

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248)](https://www.mongodb.com/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)

<br/>

[**🌐 Live API**](https://snapcart-production.up.railway.app/api) · [**◀ Back to Root**](../README.md) · [**🎨 Frontend Docs**](../frontend/README.md) · [**🐛 Report Bug**](https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project/issues)

</div>

---

## 📋 Table of Contents

- [Highlights](#-highlights)
- [Tech Stack](#-tech-stack)
- [Request Pipeline](#-request-pipeline)
- [Project Structure](#-project-structure)
- [Setup and Installation](#-setup-and-installation)
- [Scripts](#-scripts)
- [API Reference](#-api-reference)
- [Authentication and Account Security](#-authentication-and-account-security)
- [Core E-Commerce Features](#-core-e-commerce-features)
- [Email Notifications](#-email-notifications)
- [Security Measures](#-security-measures)
- [Architecture Decisions](#-architecture-decisions)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Highlights

```
✅ JWT auth              Short-lived access tokens + rotated refresh tokens in httpOnly cookies
✅ Reuse detection       Replay of a used refresh token clears all sessions and forces re-login
✅ Email verification    SHA-256 hash stored, raw token delivered, 10-minute expiry
✅ Demo email mode       Returns verification URL in API response — no paid sender domain needed
✅ Google OAuth          Account linking by email prevents duplicate users
✅ Atomic checkout       MongoDB transaction: stock decrement + order create + cart clear
✅ Heuristic recs        Related, frequently-bought, personalized — no paid ML service
✅ Seller workflow       Apply → admin approve → manage products with ownership checks
✅ Admin analytics       Revenue, orders, top products, category breakdown via aggregation
✅ Defence in depth      Helmet · CSRF · rate limiting · Zod · RBAC · audit logging
```

---

## 🛠 Tech Stack

| Layer      | Technology                         | Purpose                                                 |
| ---------- | ---------------------------------- | ------------------------------------------------------- |
| Runtime    | Node.js 20+                        | Stable LTS, native async/await                          |
| Framework  | Express.js 5                       | Native async error handling, no wrapper needed          |
| Language   | TypeScript 6                       | End-to-end type safety                                  |
| Database   | MongoDB + Mongoose 9               | Document model + Atlas transactions                     |
| Auth       | JWT + bcrypt                       | Short-lived access + hashed refresh tokens              |
| OAuth      | Google OAuth 2.0                   | `google-auth-library` with account linking              |
| Validation | Zod 4                              | Schema-first validation at route boundary               |
| Email      | Resend                             | Transactional email with demo-mode fallback             |
| Uploads    | Multer + Cloudinary v2             | Memory storage → direct stream, no disk writes          |
| Payments   | Razorpay                           | Order creation + webhook with raw-body signature check  |
| Security   | Helmet · express-rate-limit · CSRF | Defence in depth across all routes                      |
| Logging    | morgan + custom logger             | HTTP logs + structured audit events                     |
| Deployment | Railway                            | Zero-config, ephemeral filesystem handled by Cloudinary |

---

## 🔄 Request Pipeline

Every state-changing request travels through this middleware stack before reaching a controller:

```
Incoming Request
      │
      ▼
  Helmet()              — Secure HTTP headers (XSS, clickjacking, MIME sniffing)
      │
      ▼
  CORS()                — Validates Origin against FRONTEND_URL; credentials: true
      │
      ▼
  express.json()        — Body parsing with 10 KB limit
      │
      ▼
  mongoSanitize()       — Strips $ and . from keys to block NoSQL injection
      │
      ▼
  morgan()              — HTTP request logging
      │
      ▼
  generalLimiter        — 100 req / 10 min (all routes)
  authLimiter           — 20 req / 10 min (login + register only)
      │
      ▼
  csrfProtection()      — Double-submit cookie check on POST/PATCH/PUT/DELETE
      │
      ▼
  verifyToken()         — JWT from httpOnly cookie; checks isActive + passwordChangedAt
      │
      ▼
  requireRole()         — RBAC: customer | seller | admin
      │
      ▼
  requireVerifiedEmail()— Guards checkout, seller writes, and seller applications
      │
      ▼
  validate(schema)      — Zod schema check on body/params/query
      │
      ▼
  Controller → Service → Mongoose → MongoDB Atlas
      │
      ▼
  ApiResponse           — Unified JSON success/error shape
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.ts                         Express app — middleware stack, routes, error handler
│   ├── server.ts                      DB connection and HTTP server startup
│   │
│   ├── config/
│   │   ├── cloudinary.ts              Cloudinary v2 client initialisation
│   │   ├── db.ts                      MongoDB connection helper
│   │   ├── googleClient.ts            Google OAuth2 client
│   │   └── validateEnv.ts             Required env-var check — process.exit on missing
│   │
│   ├── controllers/                   Route handlers (one file per domain)
│   │   ├── admin.controller.ts        Seller moderation and analytics
│   │   ├── auth.controller.ts         Register, login, refresh, verification, password
│   │   ├── cart.controller.ts         Cart read / add / update / remove / clear
│   │   ├── googleAuth.controller.ts   Google OAuth redirect and callback
│   │   ├── order.controller.ts        Checkout, order list/detail, status updates
│   │   ├── payment.controller.ts      Razorpay order creation and webhook
│   │   ├── product.controller.ts      Product CRUD, catalog query, image upload
│   │   ├── recommendation.controller.ts  Recommendation endpoint
│   │   ├── review.controller.ts       Verified-purchase reviews
│   │   ├── seller.controller.ts       Seller application flow
│   │   └── wishlist.controller.ts     Wishlist, public sharing, email sharing
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts         verifyToken · optionalVerifyToken · requireRole · requireVerifiedEmail
│   │   ├── csrf.middleware.ts         Double-submit cookie CSRF protection
│   │   ├── multer.middleware.ts       MIME validation and memory upload
│   │   ├── sanitize.ts               Request body sanitisation
│   │   └── validate.middleware.ts    Zod schema request validation
│   │
│   ├── models/
│   │   ├── cart.model.ts
│   │   ├── order.model.ts
│   │   ├── product.model.ts
│   │   ├── review.model.ts
│   │   ├── user.model.ts
│   │   └── wishlist.model.ts
│   │
│   ├── routes/                        Express router definitions (one per domain)
│   │
│   ├── scripts/
│   │   └── seed.dev.ts               Development seed script
│   │
│   ├── services/                      Business logic — transactions live here
│   │   ├── order.service.ts          Transactional checkout logic
│   │   ├── recommendation.service.ts Scoring engine (related / bought / personalized)
│   │   └── review.service.ts         Rating recalculation
│   │
│   ├── types/
│   │   └── env.d.ts                  TypeScript augmentations for process.env
│   │
│   └── utils/
│       ├── ApiResponse.ts            Unified ApiSuccess / ApiError response classes
│       ├── asyncHandler.ts           Async controller wrapper (eliminates try/catch)
│       ├── auditLogger.ts            Security and audit event logging
│       ├── generateResetToken.ts     Raw/hash token pair generator
│       ├── generateTokens.ts         JWT creation helpers
│       └── hashToken.ts              SHA-256 hashing helper
│
├── .env.example                       ← copy to .env and fill in values
├── package.json
└── tsconfig.json
```

---

## 🚀 Setup and Installation

### Prerequisites

| Tool    | Version                                 |
| ------- | --------------------------------------- |
| Node.js | 20 or higher                            |
| npm     | 10 or higher                            |
| MongoDB | Atlas cluster (free tier is sufficient) |

### Environment Variables

```bash
cp .env.example .env
```

| Variable                       | Required | Description                                           |
| ------------------------------ | -------- | ----------------------------------------------------- |
| `NODE_ENV`                     | ✅       | `development` or `production`                         |
| `PORT`                         | ✅       | Port the server listens on (default: `5000`)          |
| `MONGO_URI`                    | ✅       | MongoDB Atlas connection string                       |
| `ACCESS_TOKEN_SECRET`          | ✅       | Random string, 32+ chars in production                |
| `REFRESH_TOKEN_SECRET`         | ✅       | Random string, 32+ chars in production                |
| `REFRESH_TOKEN_HASH_SECRET`    | ✅       | Random string for hashing stored refresh tokens       |
| `FRONTEND_URL`                 | ✅       | CORS origin, e.g. `http://localhost:5173`             |
| `GOOGLE_CLIENT_ID`             | ✅       | From Google Cloud Console                             |
| `GOOGLE_CLIENT_SECRET`         | ✅       | From Google Cloud Console                             |
| `GOOGLE_CALLBACK_URL`          | ✅       | e.g. `http://localhost:5000/api/auth/google/callback` |
| `CLOUDINARY_CLOUD_NAME`        | ✅       | From Cloudinary dashboard                             |
| `CLOUDINARY_API_KEY`           | ✅       | From Cloudinary dashboard                             |
| `CLOUDINARY_API_SECRET`        | ✅       | From Cloudinary dashboard                             |
| `EMAIL_VERIFICATION_DEMO_MODE` | Optional | `true` → returns verification URL in response         |
| `RESEND_API_KEY`               | Optional | From resend.com — required for real email delivery    |
| `RESEND_FROM_EMAIL`            | Optional | Verified sender address on your Resend domain         |
| `ADMIN_EMAIL`                  | Optional | Receives seller application notification emails       |
| `RAZORPAY_KEY_ID`              | Optional | From Razorpay dashboard                               |
| `RAZORPAY_KEY_SECRET`          | Optional | From Razorpay dashboard                               |

> 💡 **For local / portfolio deployments:** Set `EMAIL_VERIFICATION_DEMO_MODE=true`. The server returns the verification URL in the register response so you can verify accounts without a paid Resend sender domain. The full token → hash → expiry → clear flow still runs.

### Running Locally

```bash
cd backend
npm install
npm run dev     # starts on http://localhost:5000 with hot reload
```

---

## 📜 Scripts

| Command               | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Start development server with hot reload (`ts-node-dev`)   |
| `npm run build`       | Compile TypeScript to `dist/`                              |
| `npm start`           | Run the compiled production server (`node dist/server.js`) |
| `npm run lint`        | Run ESLint across `src/`                                   |
| `npm run type-check`  | Type-check without emitting files                          |
| `npm run db:seed:dev` | Seed the database with development sample data             |

---

## 📡 API Reference

All routes are prefixed with `/api`. State-changing routes (POST, PATCH, PUT, DELETE) require an `x-csrf-token` header — fetch it first from `GET /api/auth/csrf-token`.

### Auth

| Method | Path                        | Auth   | Description                                     |
| ------ | --------------------------- | ------ | ----------------------------------------------- |
| GET    | `/auth/csrf-token`          | None   | Retrieve a CSRF token cookie and value          |
| POST   | `/auth/register`            | None   | Create account and send verification email      |
| GET    | `/auth/verify-email?token=` | None   | Verify email with raw one-time token            |
| POST   | `/auth/resend-verification` | None   | Resend verification email                       |
| POST   | `/auth/login`               | None   | Log in and receive httpOnly cookies             |
| POST   | `/auth/refresh`             | Cookie | Rotate refresh token and issue new access token |
| GET    | `/auth/me`                  | Cookie | Return the current user                         |
| POST   | `/auth/logout`              | Cookie | Clear auth cookies and invalidate token         |
| PATCH  | `/auth/change-password`     | Auth   | Change password and invalidate old sessions     |
| POST   | `/auth/forgot-password`     | None   | Send password reset link                        |
| POST   | `/auth/reset-password`      | None   | Reset password with raw token                   |
| GET    | `/auth/google`              | None   | Redirect to Google OAuth consent screen         |
| GET    | `/auth/google/callback`     | None   | Handle Google OAuth callback                    |

### Products and Recommendations

| Method | Path                                                             | Auth         | Description                             |
| ------ | ---------------------------------------------------------------- | ------------ | --------------------------------------- |
| GET    | `/products`                                                      | None         | Paginated catalog with search + filters |
| GET    | `/products/recommendations?type=personalized`                    | Optional     | Personalized picks                      |
| GET    | `/products/recommendations?type=related&productId=:id`           | None         | Related products                        |
| GET    | `/products/recommendations?type=frequently-bought&productId=:id` | None         | Frequently bought together              |
| GET    | `/products/:id`                                                  | None         | Single product detail                   |
| POST   | `/products`                                                      | Seller/Admin | Create product with image upload        |
| PATCH  | `/products/:id`                                                  | Seller/Admin | Update own product                      |
| DELETE | `/products/:id`                                                  | Seller/Admin | Soft-delete own product                 |

### Cart

| Method | Path               | Auth | Description                      |
| ------ | ------------------ | ---- | -------------------------------- |
| GET    | `/cart`            | Auth | Get cart with server-side totals |
| POST   | `/cart/add`        | Auth | Add item (stock validated)       |
| PATCH  | `/cart/:productId` | Auth | Update item quantity             |
| DELETE | `/cart/:productId` | Auth | Remove item                      |
| DELETE | `/cart`            | Auth | Clear entire cart                |

### Orders

| Method | Path                 | Auth         | Description                           |
| ------ | -------------------- | ------------ | ------------------------------------- |
| POST   | `/orders`            | Auth         | Checkout — atomic MongoDB transaction |
| GET    | `/orders`            | Auth         | List the current user's orders        |
| GET    | `/orders/:id`        | Auth         | Order detail                          |
| PATCH  | `/orders/:id/status` | Seller/Admin | Update order status                   |

### Reviews

| Method | Path                  | Auth | Description                              |
| ------ | --------------------- | ---- | ---------------------------------------- |
| GET    | `/reviews/:productId` | None | List reviews for a product               |
| POST   | `/reviews/:productId` | Auth | Submit review (verified purchasers only) |
| DELETE | `/reviews/:id`        | Auth | Delete own review                        |

### Wishlist

| Method | Path                          | Auth | Description                   |
| ------ | ----------------------------- | ---- | ----------------------------- |
| GET    | `/wishlist`                   | Auth | Get user's wishlist           |
| POST   | `/wishlist/add`               | Auth | Add product to wishlist       |
| DELETE | `/wishlist/remove/:productId` | Auth | Remove product from wishlist  |
| POST   | `/wishlist/move-to-cart`      | Auth | Move all items to cart        |
| PATCH  | `/wishlist/share`             | Auth | Toggle public sharing on/off  |
| GET    | `/wishlist/share/:shareId`    | None | View a public shared wishlist |
| POST   | `/wishlist/email`             | Auth | Email a wishlist share link   |

### Seller

| Method | Path            | Auth | Description                                  |
| ------ | --------------- | ---- | -------------------------------------------- |
| POST   | `/seller/apply` | Auth | Submit application (verified email required) |

### Admin

| Method | Path                 | Auth  | Description                      |
| ------ | -------------------- | ----- | -------------------------------- |
| GET    | `/admin/sellers`     | Admin | List pending seller applications |
| PATCH  | `/admin/sellers/:id` | Admin | Approve or reject seller         |
| GET    | `/admin/analytics`   | Admin | Aggregated platform analytics    |

### Payments

| Method | Path                | Auth | Description                                     |
| ------ | ------------------- | ---- | ----------------------------------------------- |
| POST   | `/payments/order`   | Auth | Create a Razorpay order                         |
| POST   | `/payments/webhook` | None | Razorpay webhook (raw body, signature verified) |

---

## 🔐 Authentication and Account Security

### Register and Email Verification

Registration creates an account with `isEmailVerified: false`, stores a SHA-256 hash of a random verification token, and sends the raw token in a frontend verification link.

- Verification token expires after **10 minutes**
- Token is **single-use** and cleared after success
- Raw token is **never stored** in MongoDB
- Resend verification is **enumeration-safe** for unknown emails
- Verified email is required before checkout, seller application, and seller product writes

### Demo Verification Mode

If `EMAIL_VERIFICATION_DEMO_MODE=true` (or if Resend delivery fails), the backend returns a `demoVerificationUrl` field in the register/resend response. The frontend shows a "Verify in demo mode" button. The full token → hash → expiry → clear logic still runs — only the delivery mechanism changes.

### Login, Cookies, and Refresh Rotation

- Passwords compared with **bcrypt**
- Access tokens are **short-lived**
- Refresh tokens stored as **hashes**, rotated on every `/auth/refresh` call
- Tokens in **httpOnly cookies** — inaccessible to frontend JavaScript
- **Reuse detection** — replaying a used refresh token clears all tokens and forces re-login
- Tokens issued before a password change are **rejected** (`iat < passwordChangedAt`)

### Google OAuth

- Implemented through `google-auth-library`
- Google users marked email-verified when Google reports a verified email
- Existing accounts **linked by email** to prevent duplicate users

### Password Reset and Change

- Forgot password uses the same raw-token/hash-token pattern as email verification
- Reset links expire after **15 minutes**
- Reset and change-password flows **clear refresh tokens** to invalidate old sessions
- Password change **notifications** are emailed to the user

---

## 🛍 Core E-Commerce Features

### Products

- Public catalog with pagination, text search, category filtering, price filtering, and sorting
- Seller-only create/update/delete routes
- Image upload via Multer memory storage → Cloudinary upload streams
- **Soft delete** through `isActive: false` — preserves historical order data
- **Ownership checks** prevent sellers from editing other sellers' products

### Cart

- Authenticated cart with add, update quantity, remove, and clear
- **Stock validation** on every add/update
- Cart totals recalculated server-side on every mutation

### Orders — Atomic Checkout

Checkout runs inside a **MongoDB transaction**:

```
1. Validate cart items and current stock
2. Atomically decrement stock  →  findOneAndUpdate with stock guard
3. Create order snapshot        →  captures name, price, qty, image at time of purchase
4. Clear the cart
5. Commit all writes — or roll everything back on any failure
```

Status flow: `pending` → `confirmed` → `shipped` → `delivered` / `cancelled`
Cancellation **restores stock** through the service layer.

### Reviews

- Require authentication
- Restricted to verified purchasers with **`delivered`** orders
- **One review per user per product**
- `averageRating` and `totalReviews` recalculated after every review change

### Wishlist, Sharing, and Email

- One wishlist per user
- Add/remove from product cards and product detail pages
- Move all items to cart in one action
- Public sharing toggled on/off; `shareId` generated only when enabled
- Wishlist links can be **emailed** to any address via Resend

### AI Product Recommendations

| Mode                | Strategy                                                           |
| ------------------- | ------------------------------------------------------------------ |
| `related`           | Compares name/description tokens and category; blends with rating  |
| `frequently-bought` | Analyses historical order co-occurrence; falls back to `related`   |
| `personalized`      | Scores candidates using cart, wishlist, and order category history |
| Cold-start          | Returns highly-rated products when no user signal is available     |

Used on: homepage rail · product detail page · cart "Complete your order" picks.

### Admin Analytics

Metrics powered by MongoDB aggregation pipelines:

| Metric       | Details                                        |
| ------------ | ---------------------------------------------- |
| Revenue      | Total and 14-day daily trend                   |
| Orders       | Total count, average value, 14-day daily trend |
| Stock        | Low-stock product count                        |
| Top products | Ranked by quantity sold                        |
| Status split | Order status distribution                      |
| Categories   | Revenue breakdown by category                  |

---

## 📧 Email Notifications

| Trigger                 | Recipient         | Purpose                 |
| ----------------------- | ----------------- | ----------------------- |
| Register                | New user          | Email verification link |
| Resend verification     | User              | New verification link   |
| Forgot password         | User              | Password reset link     |
| Password reset success  | User              | Password changed notice |
| Password change success | User              | Password changed notice |
| Seller application      | Admin             | Seller approval alert   |
| Wishlist email share    | Entered recipient | Shared wishlist link    |

---

## 🛡 Security Measures

| Measure                   | Implementation                                                          |
| ------------------------- | ----------------------------------------------------------------------- |
| HTTP headers              | Helmet                                                                  |
| CORS                      | Credentials enabled, strict `FRONTEND_URL` origin                       |
| Cookies                   | httpOnly access and refresh tokens                                      |
| CSRF                      | Double-submit cookie; `x-csrf-token` validated with timing-safe compare |
| Rate limiting             | 100 req/10 min general; 20 req/10 min on login and register             |
| Request size              | `express.json({ limit: "10kb" })`                                       |
| Validation                | Zod schemas at route boundary                                           |
| Password storage          | bcrypt hashes only                                                      |
| Verification/reset tokens | Raw token delivered, SHA-256 hash stored                                |
| Refresh tokens            | Hashed, rotated on refresh, reuse detection                             |
| RBAC                      | `requireRole` middleware for customer / seller / admin flows            |
| Verified email guard      | `requireVerifiedEmail` on sensitive operations                          |
| Upload safety             | MIME validation + size limit + memory-only storage                      |
| Audit logging             | Login, logout, refresh, verification, password, and seller events       |
| Webhook integrity         | Raw body preserved for Razorpay signature verification                  |

---

## 🏛 Architecture Decisions

### Why httpOnly cookies instead of localStorage?

> `localStorage` is readable by JavaScript — an XSS bug can silently steal tokens. httpOnly cookies cannot be read by frontend JavaScript at all, which eliminates that entire attack surface.

### Why hash verification and reset tokens?

> Verification and reset links contain high-entropy random tokens. The backend stores only the SHA-256 hash. If the database leaks, attackers cannot use the stored hashes to construct valid links — they only ever hold the hash, never the raw secret.

### Why demo verification instead of removing email verification?

> Email verification is a strong portfolio feature, but Resend requires a verified sender domain for production sending. Demo mode keeps the real token-hash-expiry-clear architecture intact while making the project usable without a paid domain. Recruiters see the real system; they just receive the link differently.

### Why MongoDB transactions for checkout?

> Checkout writes to three collections: stock (product), order (new document), and cart (clear). Without a transaction, a crash between writes leaves the system in an inconsistent state — stock decremented but no order created, or order created but cart not cleared. Transactions make all three atomic.

### Why Multer memory storage?

> Railway's filesystem is ephemeral — files written to disk vanish on redeploy. Keeping uploads in memory and streaming directly to Cloudinary avoids temporary files, cleanup logic, and ephemeral-storage failures entirely.

### Why a heuristic recommendation engine?

> A transparent, deterministic scoring function is easy to explain, debug, and extend. It demonstrates user-signal modelling (cart history, order co-occurrence, wishlist categories) without requiring paid ML infrastructure or a black-box model that's hard to reason about in interviews.

---

## 🧪 Testing

The project does not currently include an automated test suite. For manual integration testing, start the server in development mode and use the API reference above with [Insomnia](https://insomnia.rest/) or [HTTPie](https://httpie.io/).

**Recommended manual flow:**

```bash
# 1. Fetch a CSRF token
GET /api/auth/csrf-token

# 2. Register a user
POST /api/auth/register

# 3. Verify the account (use demoVerificationUrl from the response)
GET /api/auth/verify-email?token=<raw-token>

# 4. Log in
POST /api/auth/login

# 5. Add to cart and place an order
POST /api/cart/add
POST /api/orders
```

Seed the database with sample data:

```bash
npm run db:seed:dev
```

---

## 🚢 Deployment

The backend is deployed on [Railway](https://railway.app/).

### Steps

```bash
# 1. Build TypeScript
npm run build

# 2. Start the compiled server
npm start     # node dist/server.js
```

Railway detects the `start` script in `package.json` automatically. No Procfile needed.

### Production Environment Checklist

- [ ] `NODE_ENV=production`
- [ ] `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are 32+ characters
- [ ] `MONGO_URI` points to the production Atlas cluster
- [ ] `FRONTEND_URL` matches the deployed frontend origin exactly
- [ ] `GOOGLE_CALLBACK_URL` uses the production backend domain
- [ ] `EMAIL_VERIFICATION_DEMO_MODE=false` with valid `RESEND_API_KEY` and `RESEND_FROM_EMAIL`

---

## 🤝 Contributing

1. Fork the repository and create a branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes. Follow the existing code style.
3. Run the linter and type checker before committing:

   ```bash
   npm run lint && npm run type-check
   ```

4. Open a pull request with a clear description of the change and its rationale.

For significant changes (new routes, schema changes, auth flows), open an issue first to discuss the approach.

---

## 📄 License

[ISC](https://opensource.org/licenses/ISC) © SnapCart Contributors

---

<div align="center">

[◀ Back to Root README](../README.md) · [🎨 Frontend Docs](../frontend/README.md)

</div>
