# SnapCart — Backend API

A production-grade REST API for a full-featured e-commerce platform. Built with Node.js, Express, TypeScript, and MongoDB — with a focus on security, data integrity, and clean architecture.

---

## 🚀 Live API

```
https://snapcart-production.up.railway.app/api
```

---

## 🛠 Tech Stack

| Layer            | Technology                    |
| ---------------- | ----------------------------- |
| Runtime          | Node.js                       |
| Framework        | Express.js                    |
| Language         | TypeScript                    |
| Database         | MongoDB + Mongoose            |
| Authentication   | JWT (Access + Refresh tokens) |
| Password Hashing | bcrypt (cost 12)              |
| Email            | Resend                        |
| OAuth            | Google OAuth 2.0              |
| Validation       | Zod v4                        |
| Deployment       | Railway                       |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts                     # MongoDB connection
│   │   └── validateEnv.ts            # Startup env validation
│   ├── controllers/
│   │   ├── auth.controller.ts        # Auth endpoints
│   │   ├── googleAuth.controller.ts  # Google OAuth
│   │   ├── product.controller.ts     # Product CRUD
│   │   ├── cart.controller.ts        # Cart management
│   │   ├── order.controller.ts       # Order placement
│   │   ├── review.controller.ts      # Product reviews
│   │   ├── seller.controller.ts      # Seller applications
│   │   └── admin.controller.ts       # Admin controls
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT verification + token invalidation
│   │   ├── validate.middleware.ts    # Zod schema validation
│   │   └── rateLimits.ts            # Rate limiter configs
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── product.model.ts
│   │   ├── cart.model.ts
│   │   ├── order.model.ts
│   │   └── review.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── order.routes.ts
│   │   ├── review.routes.ts
│   │   ├── seller.routes.ts
│   │   └── admin.routes.ts
│   ├── services/
│   │   ├── order.service.ts          # Order placement with MongoDB transactions
│   │   └── review.service.ts         # Rating recalculation
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── order.types.ts
│   │   ├── cart.types.ts
│   │   ├── product.types.ts
│   │   └── review.types.ts
│   ├── utils/
│   │   ├── ApiResponse.ts            # Unified response + error classes
│   │   ├── asyncHandler.ts           # Async error wrapper
│   │   ├── generateTokens.ts         # JWT generation
│   │   ├── generateResetToken.ts     # Crypto token pair generation
│   │   ├── sendVerificationEmail.ts  # Email verification sender
│   │   ├── sendPasswordResetEmail.ts # Password reset sender
│   │   └── logger.ts                 # Structured logger
│   ├── validators/
│   │   └── auth.validator.ts         # Zod schemas for auth endpoints
│   ├── app.ts                        # Express app setup
│   └── server.ts                     # Entry point
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🔐 Authentication System

### Register + Email Verification

- User registers → account created → verification email sent via Resend
- SHA-256 hashed token stored in DB, raw token emailed
- Token expires in 10 minutes, single-use
- Enumeration-safe: `resendVerification` returns the same response whether the email exists or not

### Login

- bcrypt password comparison (cost factor 12)
- Issues both access token (15 min) and refresh token (7 days)
- Tokens delivered via `httpOnly` cookies — never exposed to JavaScript
- Refresh token stored in DB for rotation + reuse detection

### JWT Rotation + Reuse Detection

- Every `/refresh` call issues a brand new refresh token and invalidates the old one
- If an old refresh token is used again → reuse detected → all tokens wiped → force re-login
- Access tokens invalidated if issued before `passwordChangedAt` — prevents stale tokens after a password reset

### Google OAuth 2.0

- Full OAuth flow via `google-auth-library`
- New users created automatically on first Google login
- Existing users linked by email

### Password Reset

- `forgotPassword` → generates raw/hashed token pair → emails raw token → stores hash in DB
- Enumeration-safe: same response whether email exists or not
- `resetPassword` → hashes incoming token → matches against DB → validates expiry → sets new password → burns token → invalidates all refresh tokens
- Token window: 15 minutes

### Change Password

- Requires current password (Google OAuth users blocked — no password to change)
- Sets `passwordChangedAt` → invalidates all existing sessions everywhere

---

## 🛡 Security

| Measure                | Implementation                                                                 |
| ---------------------- | ------------------------------------------------------------------------------ |
| Helmet                 | Secure HTTP headers on every response                                          |
| CORS                   | Strict origin allowlist, credentials enabled                                   |
| Rate limiting          | General (100/10min), Auth (10/10min), Password reset (5/15min)                 |
| NoSQL injection        | Custom sanitizer strips `$` and `.` from `req.body`, `req.query`, `req.params` |
| Body size limit        | `10kb` max via `express.json`                                                  |
| Token storage          | `httpOnly` cookies — inaccessible to JavaScript                                |
| Password hashing       | bcrypt cost 12                                                                 |
| Reset tokens           | SHA-256 hash stored, raw token emailed — DB leak reveals nothing               |
| Token invalidation     | Access tokens rejected if issued before `passwordChangedAt`                    |
| Enumeration prevention | Auth endpoints return identical responses for existing/non-existing emails     |
| Trust proxy            | Enabled for accurate IP-based rate limiting behind Railway's reverse proxy     |

---

## 🛒 E-Commerce Features

### Products

- Full CRUD with role-based access (admin/seller only for write operations)
- Pagination, filtering by category, search by name
- Soft deletes (`isActive` flag) — products hidden from customers but preserved in order history
- Compound indexes on `{ isActive, category }` and `{ isActive, seller }` for query performance

### Cart

- Add, update quantity, remove items
- Stock validation at cart-add time
- Total price calculated and stored on the cart document

### Orders

- Checkout pulls from cart — full MongoDB transaction wrapping:
  - Atomic stock check + decrement (race condition safe)
  - Order creation
  - Cart clear
  - All three writes commit together or roll back entirely
- Price snapshot on order items — historical order data unaffected by future price changes
- Order status progression: `pending → confirmed → shipped → delivered`
- Cancellation restores stock atomically via transaction

### Reviews

- Restricted to verified purchasers only — must have a delivered order containing the product
- One review per user per product
- `recalculateRating()` runs after every create/update/delete — keeps `averageRating` and `totalReviews` accurate

### Seller System

- Users apply to become sellers
- Admin approves/rejects applications
- Approved sellers can create and manage their own products
- Role-based middleware protects all seller and admin routes

## MORE FEATURES are coming SOON...

---

## 📡 API Reference

### Auth

```
POST   /api/auth/register
GET    /api/auth/verify-email?token=
POST   /api/auth/resend-verification
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/logout
PATCH  /api/auth/change-password
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/google
GET    /api/auth/google/callback
```

### Products

```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

### Cart

```
GET    /api/cart
POST   /api/cart
PATCH  /api/cart/:itemId
DELETE /api/cart/:itemId
```

### Orders

```
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
```

### Reviews

```
GET    /api/reviews/:productId
POST   /api/reviews/:productId
PATCH  /api/reviews/:reviewId
DELETE /api/reviews/:reviewId
```

### Seller

```
POST   /api/seller/apply
GET    /api/seller/status
```

### Admin

```
GET    /api/admin/sellers
PATCH  /api/admin/sellers/:id/approve
PATCH  /api/admin/sellers/:id/reject
```

---

## ⚙️ Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project.git
cd SnapCart-Ecom-Project/backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values in .env

# 4. Start development server
npm run dev
```

### Environment Variables

```bash
NODE_ENV=development
MONGO_URI=                    # MongoDB Atlas connection string
ACCESS_TOKEN_SECRET=          # Random string, min 32 chars
REFRESH_TOKEN_SECRET=         # Different random string, min 32 chars
GOOGLE_CLIENT_ID=             # Google Cloud Console
GOOGLE_CLIENT_SECRET=         # Google Cloud Console
GOOGLE_CALLBACK_URL=          # http://localhost:5000/api/auth/google/callback
FRONTEND_URL=                 # http://localhost:5173
RESEND_API_KEY=               # Resend dashboard
RESEND_FROM_EMAIL=            # Verified sender address
```

---

## 📦 Scripts

```bash
npm run dev      # Start with ts-node-dev (hot reload)
npm run build    # Compile TypeScript → dist/
npm start        # Run compiled output (production)
```

---

## 🏗 Architecture Decisions

**Why `httpOnly` cookies over `localStorage` for tokens?**
`localStorage` is accessible via JavaScript — any XSS vulnerability exposes tokens instantly. `httpOnly` cookies are invisible to JavaScript entirely, making XSS token theft impossible.

**Why SHA-256 for email/reset tokens instead of bcrypt?**
Verification and reset tokens are already high-entropy random values (32 bytes = 256 bits). bcrypt is designed for low-entropy secrets like passwords. SHA-256 is faster, deterministic, and sufficient here — bcrypt's slowness would add latency with no security benefit.

**Why MongoDB transactions for order placement?**
Stock decrement, order creation, and cart clearing must all succeed or all fail together. Without a transaction, a server crash mid-checkout could decrement stock without creating an order, or create an order without clearing the cart. Transactions make the entire operation atomic.

**Why `sameSite: "none"` in production?**
Frontend and backend are on different domains in production. `sameSite: "strict"` blocks all cross-origin cookie sending, breaking every authenticated request. `"none"` with `secure: true` (HTTPS only) allows cross-origin cookies safely.

```

---