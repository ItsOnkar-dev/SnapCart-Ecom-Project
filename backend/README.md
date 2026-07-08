# SnapCart Backend

Production-minded backend system for a multi-vendor e-commerce platform. Built with Node.js, Express, TypeScript, MongoDB, and Mongoose, with a focus on secure authentication, transactional checkout, seller workflows, wishlist sharing, recommendations, and admin analytics.

## Live API

```txt
https://snapcart-production.up.railway.app/api
```

## Highlights

- JWT auth with short-lived access tokens, refresh-token rotation, reuse detection, and httpOnly cookies.
- Email verification with hashed one-time tokens, plus demo-mode verification for portfolio deployments without a paid sender domain.
- Google OAuth 2.0 login and account linking by email.
- Product catalog with search, sorting, filtering, Cloudinary image upload, and soft deletes.
- Cart and order flow with MongoDB transactions for stock decrement, order creation, and cart clearing.
- Wishlist system with heart toggles, move-to-cart, public share links, and email sharing.
- AI-style product recommendations for related products, frequently bought together, and personalized picks.
- Admin analytics dashboard powered by MongoDB aggregations.
- Seller application and approval workflow with role-based access control.
- Review system restricted to verified purchasers.

## Tech Stack

| Layer                   | Technology                                  |
| ----------------------- | ------------------------------------------- |
| Runtime                 | Node.js                                     |
| Framework               | Express.js                                  |
| Language                | TypeScript                                  |
| Database                | MongoDB + Mongoose                          |
| Auth                    | JWT access/refresh tokens, httpOnly cookies |
| OAuth                   | Google OAuth 2.0                            |
| Validation              | Zod                                         |
| Password Hashing        | bcrypt                                      |
| Email                   | Resend                                      |
| Uploads                 | Multer memory storage + Cloudinary          |
| Charts/Analytics Source | MongoDB aggregation pipelines               |
| Deployment              | Railway                                     |

## Project Structure

```txt
backend/
  src/
    app.ts                         Express app, middleware, routes, error handler
    server.ts                      DB connection and server startup
    config/
      cloudinary.ts                Cloudinary v2 client
      db.ts                        MongoDB connection
      googleClient.ts              Google OAuth client
      validateEnv.ts               Required environment checks
    controllers/
      auth.controller.ts           Register, login, refresh, email verification, password flows
      googleAuth.controller.ts     Google OAuth redirect and callback
      product.controller.ts        Product CRUD, catalog query, image upload
      recommendation.controller.ts Product recommendation endpoint
      cart.controller.ts           Cart read/add/update/remove/clear
      order.controller.ts          Checkout, order list/detail, status updates
      review.controller.ts         Verified-purchase reviews
      wishlist.controller.ts       Wishlist, public sharing, email sharing
      seller.controller.ts         Seller application flow
      admin.controller.ts          Seller moderation and analytics
    middleware/
      auth.middleware.ts           JWT verification, optional auth, RBAC, verified email guard
      csrf.middleware.ts           Double-submit CSRF protection
      multer.middleware.ts         File validation and memory upload
      validate.middleware.ts       Zod request validation
    models/
      user.model.ts
      product.model.ts
      cart.model.ts
      order.model.ts
      review.model.ts
      wishlist.model.ts
    routes/
      auth.routes.ts
      product.routes.ts
      cart.routes.ts
      order.routes.ts
      review.routes.ts
      wishlist.routes.ts
      seller.routes.ts
      admin.routes.ts
    services/
      cart.service.ts
      order.service.ts             Transactional checkout logic
      product.service.ts
      recommendation.service.ts    Recommendation scoring engine
      review.service.ts            Rating recalculation
      seller.service.ts
      wishlist.service.ts
    utils/
      ApiResponse.ts               Unified success/error response classes
      asyncHandler.ts              Async controller wrapper
      auditLogger.ts               Security/audit events
      generateTokens.ts            JWT creation
      generateResetToken.ts        Raw/hash token pair generator
      hashToken.ts                 SHA-256 hashing helper
      logger.ts                    Structured logging
      uploadToCloudinary.ts        Buffer to Cloudinary upload stream
      sendVerificationEmail.ts
      sendPasswordResetEmail.ts
      sendPasswordChangedEmail.ts
      sendSellerApplicationEmail.ts
      sendWishlistEmail.ts
    validators/
      auth.validator.ts
      product.validator.ts
      cart.validator.ts
      order.validator.ts
      review.validator.ts
      wishlist.validator.ts
      seller.validator.ts
      admin.validator.ts
```

## Authentication And Account Security

### Register And Email Verification

Registration creates an account with `isEmailVerified: false`, stores a SHA-256 hash of a random verification token, and sends the raw token in a frontend verification link.

- Verification token expires after 10 minutes.
- Token is single-use and cleared after success.
- Raw token is never stored in MongoDB.
- Resend verification is enumeration-safe for unknown emails.
- Verified email is required before sensitive flows such as checkout, seller application, and seller product writes.

### Demo Verification Mode

Portfolio demos should not be blocked by a paid email sender domain. SnapCart keeps the real verification architecture, but adds a demo fallback:

- If `EMAIL_VERIFICATION_DEMO_MODE=true`, the backend returns `demoVerificationUrl` in the register/resend response.
- If Resend is missing or email delivery fails, the backend also returns a fallback `demoVerificationUrl`.
- The frontend verify page shows a "Verify in demo mode" button.
- The same one-time token, hash lookup, expiry, and clearing logic still runs. This is not bypassing verification; it only changes how the verification link is delivered.

Recommended for local/demo:

```env
EMAIL_VERIFICATION_DEMO_MODE=true
```

Recommended for production:

```env
EMAIL_VERIFICATION_DEMO_MODE=false
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=verify@your-verified-domain.com
```

### Login, Cookies, And Refresh Rotation

- Passwords are compared with bcrypt.
- Access tokens are short-lived.
- Refresh tokens are stored as hashes and rotated on refresh.
- Tokens are delivered with httpOnly cookies, so frontend JavaScript cannot read them.
- Refresh-token reuse detection clears the stored token and forces re-login.
- Tokens issued before a password change are rejected.

### Google OAuth

- Google login is implemented through `google-auth-library`.
- Google users are marked email-verified when Google reports a verified email.
- Existing accounts are linked by email to prevent duplicate users.

### Password Reset And Change

- Forgot password uses the same raw-token/hash-token pattern as email verification.
- Reset links expire after 15 minutes.
- Reset and change-password flows clear refresh tokens to invalidate old sessions.
- Password change notifications are emailed to the user.

## Core E-Commerce Features

### Products

- Public product catalog with pagination, text search, category filtering, price filtering, and sorting.
- Seller-only create/update/delete routes.
- Product image upload through Multer memory storage and Cloudinary upload streams.
- Soft delete through `isActive: false`, preserving historical order data.
- Seller ownership checks prevent sellers from editing other sellers' products.
- Frontend category pages include a right-side filter drawer matching the app design.

### Cart

- Authenticated cart with add, update quantity, remove item, and clear cart.
- Stock validation when items are added or updated.
- Cart totals are recalculated on server-side updates.
- Frontend cart page includes a wide checkout panel and AI picks under "Complete your order".

### Orders

Checkout is handled through a MongoDB transaction:

1. Validate cart and stock.
2. Atomically decrement stock using a guarded `findOneAndUpdate`.
3. Create order with name, price, quantity, and image snapshots.
4. Clear the cart.
5. Commit all writes together or roll everything back.

Other order behavior:

- Users can view their own order list and order details.
- Status flow supports `pending`, `confirmed`, `shipped`, `delivered`, and `cancelled`.
- Cancellation restores stock through service logic.
- Admin/seller status updates are protected by role middleware.

### Reviews

- Reviews require authentication.
- Review creation is restricted to verified purchasers with delivered orders.
- One review per user per product.
- Product `averageRating` and `totalReviews` are recalculated after review changes.

### Wishlist, Sharing, And Email

Wishlist support was added as a complete buyer feature:

- One wishlist per user.
- Add/remove products through product cards and product details.
- Move all wishlist items to cart in one action.
- Public sharing can be enabled/disabled.
- `shareId` is generated only when sharing is enabled.
- Shared wishlist pages are public and can be viewed by anyone with the link.
- Wishlist links can be emailed to another person through Resend.

### AI Product Recommendations

The recommendation engine is heuristic and explainable, which is useful for a portfolio project because it shows the data flow clearly.

Supported recommendation modes:

- `related`: compares product name/description tokens and category, then blends text similarity with rating.
- `frequently-bought`: analyzes historical order co-occurrence and falls back to related products.
- `personalized`: uses the user's cart, wishlist, and order categories to score candidate products.
- Cold-start fallback returns highly rated products.

Frontend usage:

- Homepage "Recommended For You" rail.
- Product detail recommendations.
- Cart "Complete your order" AI picks.

### Seller System

- Customers can apply to become sellers.
- Seller applications require a verified email.
- Admin receives a seller application notification email.
- Admin can approve or reject sellers.
- Approved sellers can manage their own products.

### Admin Analytics

The admin analytics endpoint uses aggregation pipelines instead of hardcoded dashboard values.

Metrics include:

- Total revenue.
- Total orders.
- Average order value.
- Low stock product count.
- 14-day daily revenue and order history.
- Top-selling products by quantity.
- Order status distribution.
- Revenue by category.

## API Reference

### Auth

```txt
GET    /api/auth/csrf-token
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

### Products And Recommendations

```txt
GET    /api/products
GET    /api/products/recommendations?type=personalized&limit=4
GET    /api/products/recommendations?type=related&productId=:id
GET    /api/products/recommendations?type=frequently-bought&productId=:id
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

### Cart

```txt
GET    /api/cart
POST   /api/cart/add
PATCH  /api/cart/:productId
DELETE /api/cart/:productId
DELETE /api/cart
```

### Orders

```txt
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
```

### Reviews

```txt
GET    /api/reviews/:productId
POST   /api/reviews/:productId
DELETE /api/reviews/:id
```

### Wishlist

```txt
GET    /api/wishlist
POST   /api/wishlist/add
DELETE /api/wishlist/remove/:productId
POST   /api/wishlist/move-to-cart
PATCH  /api/wishlist/share
GET    /api/wishlist/share/:shareId
POST   /api/wishlist/email
```

### Seller

```txt
POST   /api/seller/apply
```

### Admin

```txt
GET    /api/admin/sellers
PATCH  /api/admin/sellers/:id
GET    /api/admin/analytics
```

## Email Notifications

| Trigger                 | Recipient         | Purpose                 |
| ----------------------- | ----------------- | ----------------------- |
| Register                | New user          | Email verification      |
| Resend verification     | User              | New verification link   |
| Forgot password         | User              | Password reset link     |
| Password reset success  | User              | Password changed notice |
| Password change success | User              | Password changed notice |
| Seller application      | Admin             | Seller approval alert   |
| Wishlist email share    | Entered recipient | Shared wishlist link    |

## Security Measures

| Measure                   | Implementation                                                   |
| ------------------------- | ---------------------------------------------------------------- |
| HTTP headers              | Helmet                                                           |
| CORS                      | Credentials enabled, strict frontend origin                      |
| Cookies                   | httpOnly access and refresh tokens                               |
| CSRF                      | CSRF token route and protected state-changing routes             |
| Rate limiting             | General auth and password reset limiters                         |
| Request size              | JSON body limit                                                  |
| Validation                | Zod schemas at route boundary                                    |
| Password storage          | bcrypt hashes only                                               |
| Verification/reset tokens | Raw token delivered, SHA-256 hash stored                         |
| Refresh tokens            | Hashed refresh token stored, rotated on refresh                  |
| RBAC                      | Role middleware for customer/seller/admin flows                  |
| Verified email guard      | Sensitive operations require verified accounts                   |
| Upload safety             | MIME validation, size limit, memory storage                      |
| Audit logging             | Login, refresh, logout, verification, seller and password events |

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGO_URI=

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

RESEND_API_KEY=
RESEND_FROM_EMAIL=
ADMIN_EMAIL=
EMAIL_VERIFICATION_DEMO_MODE=true

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Local Setup

```bash
cd backend
npm install
npm run dev
```

Build and run production output:

```bash
npm run build
npm start
```

## Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/`            |
| `npm start`     | Run compiled production server           |

## Architecture Decisions

### Why httpOnly cookies instead of localStorage?

`localStorage` is readable by JavaScript, so an XSS bug can steal tokens. httpOnly cookies cannot be read by frontend JavaScript, which greatly reduces token-theft risk.

### Why hash verification and reset tokens?

Verification and reset links contain high-entropy random tokens. The backend stores only the SHA-256 hash. If the database leaks, attackers cannot use the stored hashes as valid links.

### Why demo verification instead of removing email verification?

Email verification is a strong CV feature, but Resend production sending requires a verified sender domain. Demo verification keeps the real token architecture while making the hosted project usable without paid domain setup.

### Why MongoDB transactions for checkout?

Checkout touches stock, orders, and carts. Transactions make those writes atomic, so the system cannot decrement stock without creating an order or create an order without clearing the cart.

### Why Multer memory storage?

Railway's filesystem is ephemeral. Keeping uploads in memory and streaming directly to Cloudinary avoids temporary files and cleanup issues.

### Why a heuristic recommendation engine?

It is transparent, deterministic, and easy to explain in interviews. It demonstrates user-signal modeling without requiring paid ML infrastructure.
