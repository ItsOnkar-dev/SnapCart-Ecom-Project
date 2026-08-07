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

[**🌐 Live API**](https://snapcart-production-up.render.app/api) · [**◀ Back to Root**](../README.md) · [**🎨 Frontend Docs**](../frontend/README.md) · [**🐛 Report Bug**](https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project/issues)

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
- [Email Configuration and Delivery](#email-configuration-and-delivery)
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
✅ User-friendly errors  All API errors use plain language, no internal terminology
✅ TypeScript strict     No `any` types — Mongoose boundary uses targeted eslint-disable
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
| Deployment | Render                             | Zero-config, ephemeral filesystem handled by Cloudinary |

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
│       ├── analyticsCache.ts         In-memory cache for admin analytics (5-min TTL)
│       ├── generateResetToken.ts     Raw/hash token pair generator
│       ├── generateTokens.ts         JWT creation helpers
│       ├── hashToken.ts              SHA-256 hashing helper
│       └── pagination.ts             Shared pagination params and response builder
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

| Variable                       | Required | Description                                              |
| ------------------------------ | -------- | -------------------------------------------------------- |
| `NODE_ENV`                     | ✅       | `development` or `production`                            |
| `PORT`                         | ✅       | Port the server listens on (default: `5000`)             |
| `MONGO_URI`                    | ✅       | MongoDB Atlas connection string                          |
| `ACCESS_TOKEN_SECRET`          | ✅       | Random string, 32+ chars in production                   |
| `REFRESH_TOKEN_SECRET`         | ✅       | Random string, 32+ chars in production                   |
| `REFRESH_TOKEN_HASH_SECRET`    | ✅       | Random string for hashing stored refresh tokens          |
| `FRONTEND_URL`                 | ✅       | CORS origin, e.g. `http://localhost:5173`                |
| `GOOGLE_CLIENT_ID`             | ✅       | From Google Cloud Console                                |
| `GOOGLE_CLIENT_SECRET`         | ✅       | From Google Cloud Console                                |
| `GOOGLE_CALLBACK_URL`          | ✅       | e.g. `http://localhost:5000/api/auth/google/callback`    |
| `CLOUDINARY_CLOUD_NAME`        | ✅       | From Cloudinary dashboard                                |
| `CLOUDINARY_API_KEY`           | ✅       | From Cloudinary dashboard                                |
| `CLOUDINARY_API_SECRET`        | ✅       | From Cloudinary dashboard                                |
| `EMAIL_VERIFICATION_DEMO_MODE` | Optional | `true` → returns verification URL in response            |
| `RESEND_API_KEY`               | Optional | From resend.com — required for real email delivery       |
| `RESEND_FROM_EMAIL`            | Optional | Verified sender address on your Resend domain            |
| `RESEND_EMAIL`                 | Optional | Receives seller application notification emails          |
| `ADMIN_EMAIL`                  | Optional | Used by bootstrap script — email of the primary admin    |
| `ADMIN_PASSWORD`               | Optional | Used by bootstrap script — password of the primary admin |
| `RAZORPAY_KEY_ID`              | Optional | From Razorpay dashboard                                  |
| `RAZORPAY_KEY_SECRET`          | Optional | From Razorpay dashboard                                  |

> 💡 **For local / portfolio deployments:** Set `EMAIL_VERIFICATION_DEMO_MODE=true`. The server returns the verification URL in the register response so you can verify accounts without a paid Resend sender domain. The full token → hash → expiry → clear flow still runs.

### Running Locally

```bash
cd backend
npm install
npm run dev     # starts on http://localhost:5000 with hot reload
```

---

## 📜 Scripts

| Command                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `npm run dev`             | Start development server with hot reload (`ts-node-dev`)   |
| `npm run build`           | Compile TypeScript to `dist/`                              |
| `npm start`               | Run the compiled production server (`node dist/server.js`) |
| `npm run lint`            | Run ESLint across `src/`                                   |
| `npm run type-check`      | Type-check without emitting files                          |
| `npm run db:seed:dev`     | Seed the database with development demo accounts           |
| `npm run bootstrap:admin` | Create or promote the primary admin account (idempotent)   |

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
| DELETE | `/auth/account`             | Auth   | Delete own account and related user data        |
| GET    | `/auth/google`              | None   | Redirect to Google OAuth consent screen         |
| GET    | `/auth/google/callback`     | None   | Handle Google OAuth callback                    |

### Health

| Method | Path      | Auth | Description                                |
| ------ | --------- | ---- | ------------------------------------------ |
| `GET`  | `/health` | None | Liveness probe — server uptime and status  |
| `GET`  | `/ready`  | None | Readiness probe — confirms DB is connected |

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

| Method | Path                 | Auth         | Description                                                                 |
| ------ | -------------------- | ------------ | --------------------------------------------------------------------------- |
| POST   | `/orders`            | Auth         | Checkout — atomic MongoDB transaction                                       |
| GET    | `/orders`            | Auth         | Paginated list of the current user's orders (default 10, supports `?page=`) |
| GET    | `/orders/:id`        | Auth         | Order detail                                                                |
| PATCH  | `/orders/:id/status` | Seller/Admin | Update order status                                                         |

### Reviews

| Method | Path                  | Auth | Description                                       |
| ------ | --------------------- | ---- | ------------------------------------------------- |
| GET    | `/reviews/:productId` | None | Paginated reviews (default 20, supports `?page=`) |
| POST   | `/reviews/:productId` | Auth | Submit review (verified purchasers only)          |
| DELETE | `/reviews/:id`        | Auth | Delete own review                                 |

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
| POST   | `/payments/verify`  | None | Razorpay payment verification.                  |
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

> **VERY IMPORTANT SETUP:**

### Email Configuration and Delivery

This project supports two modes for all email flows (verification, password reset, password changed notifications).

---

## Demo Mode (Default — works out of the box)

No email setup needed. When `RESEND_API_KEY` is not set, the backend automatically switches to demo mode:

- **Email verification** — the verification link is returned directly in the API response and displayed on the frontend verify page.
- **Password reset** — the reset link is returned directly in the API response and displayed as an "Open reset link" card on your frontend.
- **Password changed** — notification is skipped silently

This means you can run and test the full auth flow locally with zero configuration.

```env
# .env — demo mode, just leave these unset or empty
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

> **What triggers demo mode?**
> Any of these conditions activates it automatically:
>
> - `RESEND_API_KEY` is missing or empty
> - `RESEND_FROM_EMAIL` is missing or empty
> - `EMAIL_VERIFICATION_DEMO_MODE=true` is explicitly set

---

## Production Mode (Real emails via Resend)

When you're ready to send real emails, you need:

1. A [Resend](https://resend.com) account
2. A verified domain in Resend
3. Two environment variables set

```env
# .env — production mode
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

Once both are set, the backend sends real emails automatically — no code changes needed.

---

## Step-by-Step: Setting Up Resend

### 1. Create a Resend account

Go to [resend.com](https://resend.com) and sign up for free.

The free tier includes **3,000 emails/month** and **100 emails/day** — enough for development and small projects.

### 2. Get your API key

- Go to [resend.com/api-keys](https://resend.com/api-keys)
- Click **Create API Key**
- Give it a name (e.g. `auth-starter-dev`)
- Set permission to **Sending access**
- Copy the key — it starts with `re_`

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ You only see the key once. Copy it immediately.

### 3. Add and verify your domain

- Go to [resend.com/domains](https://resend.com/domains)
- Click **Add Domain**
- Enter your domain (e.g. `yourdomain.com`)
- Resend will give you DNS records to add (MX, SPF, DKIM)
- Add them in your domain registrar (Namecheap, Cloudflare, GoDaddy, etc.)
- Click **Verify** — DNS propagation takes 1–48 hours

Once verified, your domain shows a green **Verified** badge.

### 4. Set your from address

Use any address on your verified domain:

```env
RESEND_FROM_EMAIL=noreply@yourdomain.com
# or
RESEND_FROM_EMAIL=auth@yourdomain.com
```

### 5. Restart your backend

```bash
# Stop your backend (Ctrl+C) then:
npm run dev
```

The backend reads env vars on startup. A restart is required after changes.

---

## Verifying It Works

### Demo mode check

Submit forgot password with any registered email. You should see a **"Demo reset link"** box appear on screen with a clickable button — no email is sent.

### Production mode check

Submit forgot password with a real email address. You should receive an email within a few seconds. Check your spam folder if it doesn't arrive.

You can also check delivery status in your [Resend dashboard](https://resend.com/emails) under the **Emails** tab.

---

## Email Flows Reference

| Flow               | Trigger                       | Demo mode            | Production mode         |
| ------------------ | ----------------------------- | -------------------- | ----------------------- |
| Email verification | User registers                | Link shown on screen | Email sent to user      |
| Password reset     | Forgot password submitted     | Link shown on screen | Email sent to user      |
| Password changed   | Reset/change password success | Skipped silently     | Confirmation email sent |

---

## Customizing Email Templates

Email HTML is in `src/utils` (or `src/lib` depending on your structure).

Each function sends one email type:

```
sendVerificationEmail()      → registration verification link
sendPasswordResetEmail()     → forgot password reset link
sendPasswordChangedEmail()   → password change confirmation
```

The templates are plain HTML strings — edit them directly to match your brand. For production use, consider moving to [React Email](https://react.email) for component-based templates that Resend supports natively.

---

## Using Resend with a Free Account (No Custom Domain)

Resend's free tier lets you send emails **only to your own email address** (the one you signed up with) until you verify a domain.

This is useful for testing the real email flow before your domain is set up:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev   # Resend's shared domain — works without verification
```

> `onboarding@resend.dev` is Resend's built-in shared sender. You can use it immediately without domain verification, but emails only deliver to your own Resend account email.

Use this to confirm real email delivery works before going to production.

---

## Environment Variables Reference

| Variable                       | Required        | Description                                                     |
| ------------------------------ | --------------- | --------------------------------------------------------------- |
| `RESEND_API_KEY`               | Production only | Your Resend API key (`re_...`)                                  |
| `RESEND_FROM_EMAIL`            | Production only | Verified sender address                                         |
| `EMAIL_VERIFICATION_DEMO_MODE` | Optional        | Set `true` to force demo mode even with a Resend key configured |

---

## Common Issues

**Emails not arriving**

- Check the Resend dashboard under **Emails** — delivery status is shown there
- Check spam/junk folder
- Confirm your domain's DNS records are fully propagated (use [dnschecker.org](https://dnschecker.org))

**"Domain not verified" error from Resend**

- Your DNS records haven't propagated yet — wait up to 48 hours
- Use `onboarding@resend.dev` as `RESEND_FROM_EMAIL` temporarily

**Still in demo mode after adding keys**

- Restart your backend — env vars are read on startup
- Double-check your `.env` file has no extra spaces around the `=`
- Confirm the `.env` file is in your **backend root**, not frontend root

**`EMAIL_VERIFICATION_DEMO_MODE=true` overrides everything**

- If this is set to `true`, demo mode is forced regardless of whether Resend is configured
- Set it to `false` or remove it entirely for production

---

## Password Reset

1. `POST /forgot-password` → generates reset token, sends email first, persists to DB only if email succeeds
2. User clicks email link → lands on `FRONTEND_URL/reset-password?token=<rawToken>`
3. Frontend form collects new password
4. `POST /reset-password` → accepts { token, newPassword, confirmNewPassword }, validates match on the backend, hashes incoming token, updates password
5. Wipes `refreshToken` — forces logout on all devices
6. Sends password-changed notification email

Reset tokens expire after **15 minutes** and are single-use.

---

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
- The same demo-mode fallback also applies to password reset: when Resend is unavailable, `/auth/forgot-password` returns `demoResetUrl`
- Reset links expire after **15 minutes**
- Reset and change-password flows clear refresh tokens to invalidate old sessions
- Password change **notifications** are emailed to the user
- Users can delete their own account from the profile page, which removes the user record and related cart/wishlist data

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

Checkout (COD/admin) runs inside a **MongoDB transaction**:

```
1. Validate cart items and current stock
2. Atomically decrement stock  →  findOneAndUpdate with stock guard
3. Create order snapshot        →  captures name, price, qty, image at time of purchase
4. Clear the cart
5. Commit all writes — or roll everything back on any failure
```

### Payments — Razorpay Flow

The payment flow uses two server endpoints plus a webhook safety net:

```
1. POST /payments/create-order
   - Validates stock and shipping address server-side
   - Calculates totals (NEVER trusts the frontend)
   - Creates Razorpay payment intent
   - Saves a pending Order to MongoDB with shippingAddress,
     status: "pending", paymentStatus: "pending"
   - Returns { orderId, amount, currency, keyId } to the frontend

2. POST /payments/verify
   - Called after user completes payment in Razorpay popup
   - Verifies HMAC-SHA256 signature on order_id|payment_id
   - Confirms the pending order → status: "confirmed"
   - Atomically decrements stock for each item
   - Clears the cart

3. POST /payments/webhook (server-to-server from Razorpay)
   - Safety net for when user closes tab before /verify
   - Raw-body HMAC-SHA256 signature verification
   - Finds pending order by razorpayOrderId (saved in step 1)
   - Confirms order, decrements stock, clears cart
   - Idempotent — skips if /verify already processed
```

### Coupons

- Admin coupon CRUD with expiry, minimum order, usage limit, and active/inactive toggles
- `POST /api/coupons/apply` validates coupon codes during checkout and enforces all coupon rules

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

Metrics computed via MongoDB aggregation pipelines and cached in memory with a 5-minute TTL. The cache is automatically invalidated when an order is placed or its status changes.

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

| Measure                   | Implementation                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP headers              | Helmet                                                                                                                                |
| CORS                      | Credentials enabled, strict `FRONTEND_URL` origin                                                                                     |
| Cookies                   | httpOnly access and refresh tokens (inaccessible to JS)                                                                               |
| CSRF                      | Double-submit cookie pattern; non-httpOnly `csrfToken` cookie compared against `x-csrf-token` header using `crypto.timingSafeEqual`   |
| CSRF enforcement          | Single global middleware in `app.ts` covering all POST/PATCH/PUT/DELETE under `/api` (auth routes excluded; webhook uses HMAC-SHA256) |
| CSRF cross-origin         | Token returned in response body for cross-origin frontends (Vercel → Render)                                                          |
| Rate limiting             | 100 req/10 min general; 20 req/10 min login/register; 5 req/10 min password reset; 60 req/10 min refresh; 100 req/min webhook         |
| Request size              | `express.json({ limit: "10kb" })`                                                                                                     |
| Validation                | Zod schemas at route boundary                                                                                                         |
| NoSQL injection           | Custom `mongoSanitize` middleware strips `$` and `.` from keys                                                                        |
| Password storage          | bcrypt hashes only                                                                                                                    |
| Verification/reset tokens | Raw token delivered, SHA-256 hash stored (raw never persisted)                                                                        |
| Refresh tokens            | HMAC-SHA256 hashed, rotated on refresh, reuse detection                                                                               |
| RBAC                      | `requireRole` + `requirePermission` — roles and permissions defined in `config/permissions.ts`, never stored per-user                 |
| Verified email guard      | `requireVerifiedEmail` on sensitive operations                                                                                        |
| Upload safety             | MIME validation + 5MB limit + memory-only storage (no disk writes)                                                                    |
| Audit logging             | Login, logout, refresh, verification, password, and seller events                                                                     |
| Webhook integrity         | Raw body preserved for Razorpay HMAC-SHA256 signature verification                                                                    |

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

> Render's filesystem is ephemeral — files written to disk vanish on redeploy. Keeping uploads in memory and streaming directly to Cloudinary avoids temporary files, cleanup logic, and ephemeral-storage failures entirely.

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

The backend is deployed on [Render](https://render.com/).

> ## ⚡ Performance Note: Render Free Tier "Cold Starts"
>
> This project's backend API is hosted on **Render's Free Tier**. To conserve resources, Render automatically spins down free web services after 15 minutes of inactivity.
>
> If you are visiting the live demo for the first time in a while, **the initial load may take 4 to 6 seconds** while the backend container wakes up.
>
> **How I mitigated this challenge:**
> To provide a smooth experience despite zero-budget infrastructure constraints, I implemented a multi-layered approach:
>
> 1. **Infrastructure Keep-Alive:** A scheduled cron job (via cron-job.org) pings a lightweight `/api/v1/health` endpoint every 14 minutes to prevent the server from sleeping during peak hours.
> 2. **UX Fallback:** The React frontend utilizes a delayed-timeout "Smart Loader". If the initial API handshake exceeds 3 seconds, the UI gracefully informs the user that the free-tier server is waking up, managing expectations rather than leaving them staring at a frozen screen.
>
> Once the server is awake, all subsequent API requests and page loads execute in standard milliseconds.

### Steps

```bash
# 1. Build TypeScript
npm run build

# 2. Start the compiled server
npm start     # node dist/server.js
```

Render detects the `start` script in `package.json` automatically. No Procfile needed.

### Production Environment Checklist

- [ ] `NODE_ENV=production`
- [ ] `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are 32+ characters
- [ ] `MONGO_URI` points to the production Atlas cluster
- [ ] `FRONTEND_URL` matches the deployed frontend origin exactly
- [ ] `GOOGLE_CALLBACK_URL` uses the production backend domain
- [ ] `EMAIL_VERIFICATION_DEMO_MODE=false` with valid `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for production
- [ ] `EMAIL_VERIFICATION_DEMO_MODE=true` for portfolio/local deployments (skip paid Resend domain)

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
