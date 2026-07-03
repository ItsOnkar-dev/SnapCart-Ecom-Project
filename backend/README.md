# SnapCart — Backend API

> A production-grade REST API for a full-featured multi-vendor e-commerce platform.
> Built with Node.js, Express, TypeScript, and MongoDB — engineered with a focus on security, data integrity, and clean architecture.

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
| Image Upload     | Multer + Cloudinary           |
| Logging          | Custom structured logger      |
| Deployment       | Railway                       |

---

## 📁 Project Structure

```
backend/
└── src/
    ├── app.ts                              # Express app — middleware, routes, error handler
    ├── server.ts                           # Entry point — DB connect, server start
    │
    ├── config/
    │   ├── cloudinary.ts                   # Cloudinary v2 client setup
    │   ├── db.ts                           # MongoDB Atlas connection
    │   ├── googleClient.ts                 # Google OAuth client
    │   └── validateEnv.ts                  # Startup env variable validation
    │
    ├── controllers/
    │   ├── auth.controller.ts              # Register, login, logout, refresh, me, password flows
    │   ├── googleAuth.controller.ts        # Google OAuth callback handler
    │   ├── product.controller.ts           # Product CRUD + image upload
    │   ├── cart.controller.ts              # Cart management
    │   ├── order.controller.ts             # Order placement + status management
    │   ├── review.controller.ts            # Product reviews
    │   ├── seller.controller.ts            # Seller application flow
    │   └── admin.controller.ts             # Admin controls
    │
    ├── middleware/
    │   ├── auth.middleware.ts              # JWT verification + token invalidation + RBAC
    │   ├── multer.middleware.ts            # File upload validation (memory storage)
    │   └── validate.middleware.ts          # Zod request validation
    │
    ├── models/
    │   ├── user.model.ts
    │   ├── product.model.ts
    │   ├── cart.model.ts
    │   ├── order.model.ts
    │   └── review.model.ts
    │
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── product.routes.ts
    │   ├── cart.routes.ts
    │   ├── order.routes.ts
    │   ├── review.routes.ts
    │   ├── seller.routes.ts
    │   └── admin.routes.ts
    │
    ├── services/
    │   ├── order.service.ts                # Order placement with MongoDB transactions
    │   └── review.service.ts               # Rating recalculation
    │
    ├── types/
    │   ├── env.d.ts                        # TypeScript declarations for process.env
    │   ├── user.types.ts
    │   ├── product.types.ts
    │   ├── cart.types.ts
    │   ├── order.types.ts
    │   └── review.types.ts
    │
    ├── utils/
    │   ├── ApiResponse.ts                  # Unified ApiResponse + ApiError classes
    │   ├── asyncHandler.ts                 # Async error wrapper — no try/catch in controllers
    │   ├── generateTokens.ts               # JWT access + refresh token generation
    │   ├── generateResetToken.ts           # Crypto token pair (raw + SHA-256 hash)
    │   ├── logger.ts                       # Structured logger with levels + timestamps
    │   ├── uploadToCloudinary.ts           # Buffer → Cloudinary upload stream
    │   ├── sendVerificationEmail.ts        # Email verification sender
    │   ├── sendPasswordResetEmail.ts       # Password reset link sender
    │   ├── sendPasswordChangedEmail.ts     # Password change security notification
    │   └── sendSellerApplicationEmail.ts   # Seller application admin notification
    │
    └── validators/
        ├── auth.validator.ts               # Zod schemas for all auth endpoints
        └── product.validator.ts            # Zod schemas for product endpoints
```

---

## 🔐 Authentication System

### Register + Email Verification

- User registers → account created with `isEmailVerified: false` → verification email sent via Resend
- SHA-256 hashed token stored in DB, raw token emailed as a link
- Token expires in 10 minutes, single-use — cleared from DB on success
- Enumeration-safe: `resendVerification` returns the same response whether the email exists or not

### Login

- bcrypt password comparison (cost factor 12)
- Issues both access token (15 min) and refresh token (7 days)
- Tokens delivered via `httpOnly` cookies — never exposed to JavaScript
- Refresh token stored in DB for rotation + reuse detection

### JWT Rotation + Reuse Detection

- Every `/refresh` call issues a brand new refresh token and invalidates the old one
- If an old (already-rotated) refresh token is used → reuse detected → all tokens wiped → force re-login everywhere
- Access tokens rejected if issued before `passwordChangedAt` — stale tokens from before a password change stop working immediately

### Google OAuth 2.0

- Full OAuth flow via `google-auth-library` (no Passport.js)
- New users auto-created on first Google login
- Existing users linked by email — no duplicate accounts

### Password Reset

- `forgotPassword` → generates raw/hashed token pair → emails raw token → stores hash + 15-min expiry in DB
- Enumeration-safe: same 200 response whether the email exists or not
- `resetPassword` → hashes incoming raw token → matched against DB hash + expiry in a single query → sets new password + `passwordChangedAt` → burns token → wipes refresh token
- Security notification email fired to user confirming the change

### Change Password

- Requires current password verification first
- Google OAuth users blocked — no password to change
- Sets `passwordChangedAt` → invalidates all existing sessions on every device
- Security notification email fired immediately after success

---

## 📸 Image Upload

Built with **Multer (memory storage) + Cloudinary v2** — no disk involved anywhere in the pipeline.

```
Request (multipart/form-data)
  → Multer        — validates MIME type + 5MB size limit, holds file in RAM as Buffer
  → Cloudinary    — Buffer streamed directly via upload_stream
                  — stored in snapcart/products/ folder
                  — dimensions capped at 1000×1000 (crop: limit)
  → Controller    — saves secure_url to MongoDB images array
```

**Why memory storage:** Railway uses an ephemeral filesystem — files written to disk can vanish between requests. Memory storage means nothing ever touches disk.

**Why not `multer-storage-cloudinary`:** That package requires `cloudinary@^1.x` — SnapCart uses `cloudinary@^2.x`. The upload stream approach is the correct pattern for v2 and gives more control.

Image upload is wired on:

- `POST /api/products` — required (product must have an image)
- `PATCH /api/products/:id` — optional (only replaces if a new file is sent)

---

## 📧 Email Notifications

All emails sent via Resend with `httpOnly` delivery pattern — fire and forget with `try/catch` so a Resend failure never fails the primary operation.

| Trigger                      | Recipient | Email                        |
| ---------------------------- | --------- | ---------------------------- |
| Register                     | New user  | Verify your SnapCart account |
| Resend verification          | User      | Verify your SnapCart account |
| Forgot password              | User      | Reset your SnapCart password |
| Password reset success       | User      | Your password was changed    |
| Password change success      | User      | Your password was changed    |
| Seller application submitted | Admin     | New seller application       |

---

## 🛡 Security

| Measure                | Implementation                                                                 |
| ---------------------- | ------------------------------------------------------------------------------ |
| Helmet                 | Secure HTTP headers on every response                                          |
| CORS                   | Strict origin allowlist, credentials enabled, `sameSite: "none"` in production |
| Rate limiting          | General (100/10min), Auth (10/10min), Password reset (5/15min)                 |
| NoSQL injection        | Custom sanitizer strips `$` and `.` from `req.body`, `req.query`, `req.params` |
| Body size limit        | 10kb max via `express.json`                                                    |
| Token storage          | `httpOnly` cookies — inaccessible to JavaScript                                |
| Password hashing       | bcrypt cost 12                                                                 |
| Reset tokens           | SHA-256 hash stored, raw token emailed — DB leak reveals nothing usable        |
| Token invalidation     | Access tokens rejected if issued before `passwordChangedAt`                    |
| Enumeration prevention | Auth endpoints return identical responses for existing/non-existing emails     |
| Trust proxy            | Enabled for accurate IP-based rate limiting behind Railway's reverse proxy     |
| File validation        | MIME type check + 5MB limit before any file reaches Cloudinary                 |

---

## 🛒 E-Commerce Features

### Products

- Full CRUD with role-based access (approved sellers only for write operations)
- Pagination, filtering by category, price range, and text search by name
- Image upload via Cloudinary — stored as URL in DB
- Soft deletes (`isActive: false`) — products hidden from customers but preserved in order history
- Compound indexes on `{ isActive, category }` and `{ isActive, seller }` for query performance

### Cart

- Add, update quantity, remove items
- Stock validation at cart-add time
- Total price calculated and stored on the cart document

### Orders

- Checkout pulls from cart — entire operation wrapped in a MongoDB transaction:
  - Atomic stock check + decrement (race condition safe via `findOneAndUpdate` with `$gte` guard)
  - Order creation with price snapshot
  - Cart clear
  - All three writes commit together or roll back entirely
- Price snapshot on order items — historical order data unaffected by future price changes
- Order status progression: `pending → confirmed → shipped → delivered`
- Cancellation restores stock atomically via transaction
- Logic extracted to `order.service.ts` — controller stays thin

### Reviews

- Restricted to verified purchasers — must have a `delivered` order containing the product
- One review per user per product (enforced at DB level)
- `recalculateRating()` runs after every create/update/delete — keeps `averageRating` and `totalReviews` accurate
- Logic extracted to `review.service.ts`

### Seller System

- Customers apply to become sellers via `POST /api/seller/apply`
- Admin notified by email on every new application
- Admin approves or rejects via `PATCH /api/admin/sellers/:id`
- Approved sellers can create and manage their own products only
- Role-based middleware protects all seller and admin routes

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
GET    /api/products                    # public — paginated, filterable
GET    /api/products/:id               # public
POST   /api/products                    # seller only — multipart/form-data
PATCH  /api/products/:id               # seller only — multipart/form-data
DELETE /api/products/:id               # seller only — soft delete
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
PATCH  /api/admin/sellers/:id
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
MONGO_URI=                      # MongoDB Atlas connection string
ACCESS_TOKEN_SECRET=            # Random string, min 32 chars
REFRESH_TOKEN_SECRET=           # Different random string, min 32 chars
GOOGLE_CLIENT_ID=               # Google Cloud Console
GOOGLE_CLIENT_SECRET=           # Google Cloud Console
GOOGLE_CALLBACK_URL=            # http://localhost:5000/api/auth/google/callback
FRONTEND_URL=                   # http://localhost:5173
RESEND_API_KEY=                 # Resend dashboard
RESEND_FROM_EMAIL=              # Verified sender address
ADMIN_EMAIL=                    # Email that receives seller application notifications
CLOUDINARY_CLOUD_NAME=          # Cloudinary dashboard
CLOUDINARY_API_KEY=             # Cloudinary dashboard
CLOUDINARY_API_SECRET=          # Cloudinary dashboard
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
Verification and reset tokens are already high-entropy random values (32 bytes = 256 bits of entropy). bcrypt is designed for low-entropy secrets like passwords. SHA-256 is faster, deterministic, and sufficient for random tokens — bcrypt's intentional slowness would add latency with zero security benefit.

**Why MongoDB transactions for order placement?**
Stock decrement, order creation, and cart clearing must all succeed or all fail together. Without a transaction, a server crash mid-checkout could decrement stock without creating an order, or create an order without clearing the cart. Transactions make the entire operation atomic — all three writes land together or none of them do.

**Why `sameSite: "none"` in production?**
Frontend and backend live on different domains in production. `sameSite: "strict"` blocks all cross-origin cookie sending — every authenticated API call would arrive with no cookie, silently breaking auth. `"none"` with `secure: true` (HTTPS only) allows cross-origin cookies safely.

**Why memory storage for Multer instead of disk?**
Railway's filesystem is ephemeral — files written to disk can disappear between requests or on redeploy. Memory storage keeps the file in RAM only for the duration of the upload stream, then it's gone. No temp files, no cleanup logic, no silent production failures.

**Why extract order and review logic into services?**
Controllers should only handle HTTP — reading the request, calling business logic, sending the response. Anything involving DB transactions, multi-step operations, or reusable logic belongs in a service. `order.service.ts` and `review.service.ts` make the code testable in isolation and keep controllers thin and readable.

---ntend and backend live on different domains in production. `sameSite: "strict"` blocks all cross-origin cookie sending — every authenticated API call would arrive with no cookie, silently breaking auth. `"none"` with `secure: true` (HTTPS only) allows cross-origin cookies safely.

**Why memory storage for Multer instead of disk?**
Railway's filesystem is ephemeral — files written to disk can disappear between requests or on redeploy. Memory storage keeps the file in RAM only for the duration of the upload stream, then it's gone. No temp files, no cleanup logic, no silent production failures.

**Why extract order and review logic into services?**
Controllers should only handle HTTP — reading the request, calling business logic, sending the response. Anything involving DB transactions, multi-step operations, or reusable logic belongs in a service. `order.service.ts` and `review.service.ts` make the code testable in isolation and keep controllers thin and readable.

---
