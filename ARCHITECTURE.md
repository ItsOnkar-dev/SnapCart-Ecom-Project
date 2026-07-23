# SnapCart Architecture

SnapCart is a **production-grade full-stack multi-vendor e-commerce platform** built as a monorepo with a Node.js/Express 5 REST API backend and a React 19 + Vite SPA frontend. This document describes its architecture, design decisions, and conventions.

---

## Table of Contents

- [Folder Structure](#folder-structure)
- [Tech Stack](#tech-stack)
- [Application Architecture](#application-architecture)
- [Authentication Flow](#authentication-flow)
- [Authorization Flow](#authorization-flow)
- [Database Schema & Relationships](#database-schema--relationships)
- [API Architecture](#api-architecture)
- [React Query Usage](#react-query-usage)
- [Zustand Usage](#zustand-usage)
- [Security Architecture](#security-architecture)
- [Checkout Flow](#checkout-flow)
- [Recommendation Engine](#recommendation-engine)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Coding Conventions](#coding-conventions)
- [Known Technical Debt](#known-technical-debt)
- [Suggested Improvements](#suggested-improvements)

---

## Folder Structure

```
SnapCart-Ecom Project/
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Express app — middleware stack, routes, error handler
│   │   ├── server.ts               # DB connection + HTTP server startup
│   │   ├── config/                 # DB, Cloudinary, Google OAuth, env validation
│   │   ├── controllers/            # 11 route handlers — thin, delegate to services
│   │   ├── middleware/             # auth, csrf, multer, sanitize, validate
│   │   ├── models/                 # 6 Mongoose schemas (User, Product, Order, Cart, Review, Wishlist)
│   │   ├── routes/                 # 9 Express routers
│   │   ├── services/               # 7 business-logic modules
│   │   ├── types/                  # TypeScript interfaces and type augmentations
│   │   ├── utils/                  # ApiResponse, asyncHandler, auditLogger, analyticsCache, pagination, tokens, email senders (5)
│   │   ├── validators/             # Zod schemas per domain
│   │   └── scripts/seed.dev.ts     # Development seed data
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                # Entry point — QueryClientProvider, AppRouter, Toaster
│   │   ├── App.tsx                 # Route definitions (createBrowserRouter)
│   │   ├── index.css               # Tailwind CSS v4 + custom CSS variables
│   │   ├── api/                    # 11 files — plain async functions for every domain
│   │   ├── hooks/                  # 11 files — TanStack Query hooks (queries + mutations)
│   │   ├── components/
│   │   │   ├── home/               # Hero, DepartmentGrid, ProductCard, ProductRail, etc.
│   │   │   ├── layout/             # Header (6 sub-components), Footer, AuthLayout
│   │   │   ├── ui/                 # 12 shadcn/ui primitives (Button, Dialog, Carousel, etc.)
│   │   │   └── AuthGate.tsx        # Boot-time auth initialization + splash screen
│   │   ├── pages/                  # 18 route-level components across 11 directories
│   │   ├── router/                 # ProtectedRoute.tsx, RoleRoute.tsx
│   │   ├── schemas/                # Zod form validation schemas (auth, cart, product, review)
│   │   ├── store/                  # Zustand auth store
│   │   ├── lib/                    # Axios client + cn() utility
│   │   └── types/                  # 9 TypeScript interface files
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── .github/                        # GitHub Actions CI/CD
└── .gitignore
```

---

## Tech Stack

### Backend

| Layer              | Technology                                     |
| ------------------ | ---------------------------------------------- |
| Runtime            | Node.js 20+                                    |
| Framework          | Express 5 (native async error handling)        |
| Language           | TypeScript 6                                   |
| Database           | MongoDB + Mongoose 9 (Atlas with transactions) |
| Auth               | JWT (15m access) + bcrypt + httpOnly cookies   |
| OAuth              | Google OAuth 2.0 via `google-auth-library`     |
| Validation         | Zod 4 (schema-first)                           |
| Email              | Resend (with demo-mode fallback)               |
| Uploads            | Multer (memory stream) → Cloudinary            |
| Payments           | Razorpay (order creation + HMAC webhook)       |
| Security           | Helmet · CSRF double-submit · rate-limit · Zod |
| Logging            | Morgan (HTTP) + custom structured logger       |

### Frontend

| Layer              | Technology                                          |
| ------------------ | --------------------------------------------------- |
| Framework          | React 19 (concurrent, Suspense lazy loading)        |
| Build Tool         | Vite 8                                              |
| Language           | TypeScript 6                                        |
| Styling            | Tailwind CSS v4 + shadcn/ui (Radix UI primitives)   |
| Routing            | React Router v7 (nested, `createBrowserRouter`)     |
| Server State       | TanStack React Query v5                             |
| Client State       | Zustand v5 (auth store only)                        |
| HTTP Client        | Axios v1 (CSRF injection + refresh interceptors)    |
| Forms              | react-hook-form v7 + Zod                            |
| Charts             | Recharts (admin analytics)                          |
| Icons              | HugeIcons + Lucide React                            |
| Notifications      | Sonner                                              |
| Payments           | Razorpay Web SDK (dynamically loaded popup)         |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               Monorepo Root                                │
│                                                                             │
│   ┌──────────────────────────────┐       ┌────────────────────────────┐    │
│   │         frontend/            │       │         backend/           │    │
│   │   React 19 + Vite 8 SPA     │ HTTP  │   Express 5 REST API       │    │
│   │   Port 5173 (dev)           ├──────►│   Port 5000                │    │
│   │                              │cookies│                            │    │
│   └──────────────────────────────┘       └──────────┬─────────────────┘    │
│                                                      │                      │
│                                    ┌─────────────────▼─────────────────┐   │
│                                    │          MongoDB Atlas            │   │
│                                    │   Users · Products · Orders       │   │
│                                    │   Cart · Reviews · Wishlists     │   │
│                                    └───────────────────────────────────┘   │
│                                                                             │
│   ┌────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │
│   │ Cloudinary │  │    Resend    │  │   Google   │  │    Razorpay      │  │
│   │  (images)  │  │   (email)    │  │   OAuth    │  │  (payments)      │  │
│   └────────────┘  └──────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Pipeline (Backend)

```
Browser request
  ↓
Helmet (security HTTP headers)
  ↓
Morgan (HTTP logging)
  ↓
Raw-body parser (only /api/payments/webhook — Razorpay signature needs raw body)
  ↓
express.json (10kb limit) + urlencoded + cookie-parser
  ↓
mongoSanitize (strips $ and . from keys — NoSQL injection prevention)
  ↓
CORS (allowed origins: localhost:5173 + FRONTEND_URL)
  ↓
Rate limiter (4 tiers: general 100, auth 20, password-reset 5, refresh 60 per 10 min)
  ↓
CSRF (double-submit cookie, skipped for GET/HEAD/OPTIONS and webhook)
  ↓
verifyToken (JWT from httpOnly cookie, checks isActive + passwordChangedAt)
  ↓
requireRole | optionalVerifyToken | requireVerifiedEmail
  ↓
validate(schema) — Zod schema parse on req.body
  ↓
Controller → Service → Mongoose → MongoDB
  ↓
ApiResponse (unified JSON shape)
```

### Frontend Component Tree

```
<QueryClientProvider>
  <Toaster />
  <RouterProvider>
    <AuthGate>                                    ← calls initAuth() on mount, 2s min splash
      <AuthLayout />                              ← centered layout for auth pages
        /login, /register, /verify-email,
        /forgot-password, /reset-password
      <MainLayout>                                ← Header + Outlet + Footer
        <HomePage />
        <ProductsPage />, <ProductDetailPage />   ← public
        <WishlistSharePage />                     ← public
        <ProtectedRoute>                          ← redirects to /login if no user
          <CartPage />, <OrdersPage />, ...
          <RoleRoute allowedRoles={["seller","admin"]}>
            <SellerProductsPage />
          </RoleRoute>
          <RoleRoute allowedRoles={["admin"]}>
            <AdminSellersPage />
            <AdminAnalyticsDashboard />
          </RoleRoute>
        </ProtectedRoute>
        <NotFound />, <Unauthorized />            ← error pages
      </MainLayout>
    </AuthGate>
  </RouterProvider>
</QueryClientProvider>
```

---

## Authentication Flow

### Local (Email/Password) Auth

```
FRONTEND                          BACKEND                         DATABASE
   │                                │                                │
   │  POST /auth/register           │                                │
   │  { name, email, password }     │                                │
   │──────────────────────────────► │  bcrypt(password, 12)          │
   │                                │  create user                   │
   │                                │───────────────────────────────►│
   │                                │  generate email verify token   │
   │                                │  store SHA-256 hash            │
   │                                │───────────────────────────────►│
   │                                │  send verification email       │
   │◄── { success, message }        │  (or return demo URL)          │
   │                                │                                │
   │  POST /auth/login              │                                │
   │  { email, password }           │                                │
   │──────────────────────────────► │  bcrypt compare                │
   │                                │  generateAccessToken(userId)   │
   │                                │  generateRefreshToken(userId)  │
   │                                │  hash refresh token → store    │
   │                                │───────────────────────────────►│
   │◄── Set-Cookie: accessToken     │                                │
   │◄── Set-Cookie: refreshToken    │                                │
   │    (both httpOnly, secure)     │                                │
```

### Token Refresh Flow

```
1. Access token expires (15 min)
2. Axios interceptor catches 401
3. Calls POST /auth/refresh (using raw axios, not `api`, to avoid interceptor loop)
4. Backend verifies refreshToken cookie, checks HMAC-hashed value in DB
5. Issues NEW access token + NEW refresh token (rotation)
6. Reuse detection: if old refresh token is replayed after rotation,
   all user sessions are invalidated (security measure)
7. Queued concurrent 401 retries are resolved
8. Original failed request is retried
```

### Token Invalidation After Password Change

The User model stores `passwordChangedAt` (timestamp). Each access token contains an `iat` (issued-at) claim. The `verifyToken` middleware compares `iat` against `passwordChangedAt`. Any token issued before the password was changed is rejected, forcing re-login across all devices.

### Email Verification

1. On register, a raw token + expiry (10 min) is generated
2. SHA-256 hash of the raw token is stored in the User document (never stored raw)
3. Verification email is sent via Resend with `FRONTEND_URL/verify-email?token=<raw>`
4. On verification, the raw token is hashed again and compared (timing-safe hash comparison)
5. **Demo mode**: When `EMAIL_VERIFICATION_DEMO_MODE=true`, the API returns `demoVerificationUrl` directly in the register response — no Resend API key needed

### Google OAuth

```
1. Frontend links to backend GET /api/auth/google
2. Backend redirects to Google consent screen with state nonce
3. User consents, Google redirects to /api/auth/google/callback
4. Backend exchanges code for tokens via google-auth-library
5. Finds or creates user by googleId (links to existing email-matched account)
6. Issues JWT cookies, redirects to FRONTEND_URL
```

---

## Authorization Flow

### Role-Based Access Control (RBAC)

Three roles, enforced at the route level via composable middleware:

| Role       | Guard Middleware                    | Capabilities                                                      |
| ---------- | ----------------------------------- | ----------------------------------------------------------------- |
| `customer` | `requireRole("customer")`           | Browse, cart, checkout, orders, reviews, wishlist                 |
| `seller`   | `requireRole("seller")`             | Customer capabilities + manage own products, update order status  |
| `admin`    | `requireRole("admin")`              | All seller capabilities + manage seller applications, analytics   |

The `requireRole(...roles)` middleware accepts multiple roles (e.g. `requireRole("seller", "admin")`) for routes shared between seller and admin.

### Seller Application Flow

```
customer → applies via POST /seller/apply
   ↓
sellerStatus changes to "pending"
   ↓
admin reviews via GET /admin/sellers
   ↓
PATCH /admin/sellers/:id { decision: "approved" | "rejected" }
   ↓
if approved → role updated to "seller", sellerStatus → "approved"
```

### Email Verification Gate

Certain actions require verified email before proceeding:
- Checkout (payment flow)
- Product creation/update (seller routes)
- Seller application

The `requireVerifiedEmail` middleware checks `user.isEmailVerified` and returns 403 if false.

### Ownership Enforcement

- **Products**: Only the owning seller can update/delete their own products
- **Orders**: Users can only view their own orders; sellers/admin can update status
- **Reviews**: Users can only delete their own reviews
- **Cart/Wishlist**: Always scoped to the authenticated user

---

## Database Schema & Relationships

### Entity Relationship

```
User (6 models across the codebase)
  │
  ├── has one ──► Cart (1:1, unique user ref)
  ├── has many ─► Order (1:N, user ref)
  ├── has many ─► Product (1:N, seller ref)
  ├── has many ─► Review (1:N, user ref)
  └── has one ──► Wishlist (1:1, unique user ref)

Product
  ├── belongs to ───► User (seller)
  ├── has many ──────► Review (1:N, product ref)
  └── referenced in ─► Order.items[], Cart.items[], Wishlist.items[]

Order
  ├── belongs to ──► User
  └── contains ────► items[] (embedded: product ref + snapshot data)

Review
  ├── belongs to ──► User
  └── belongs to ──► Product
      (compound unique index on { product, user })
```

### User Model

| Field                     | Type                                    | Notes                                        |
| ------------------------- | --------------------------------------- | -------------------------------------------- |
| `name`                    | String (2-50 chars)                     | Required                                     |
| `email`                   | String (lowercase, unique sparse index) | Required                                     |
| `password`                | String (select: false)                  | bcrypt hashed, min 8 chars                   |
| `role`                    | `"customer" \| "seller" \| "admin"`     | Default: `customer`                          |
| `sellerStatus`            | `"none" \| "pending" \| "approved" \| "rejected"` | Tracks seller application         |
| `sellerApplication`       | Embedded sub-doc                        | storeName, contactEmail, phone, taxId, etc.  |
| `isEmailVerified`         | Boolean                                 | Default: `false`                             |
| `googleId`                | String (unique sparse index)            | For Google OAuth linking                     |
| `refreshToken`            | String (select: false)                  | HMAC-SHA256 hashed                           |
| `emailVerificationToken`  | String (select: false)                  | SHA-256 hashed                               |
| `emailVerificationTokenExpiry` | Date (select: false)               | 10-minute expiry                             |
| `passwordResetToken`      | String (select: false)                  | Hashed                                       |
| `passwordResetTokenExpiry` | Date (select: false)                   | 15-minute expiry                             |
| `passwordChangedAt`       | Date (select: false)                    | Invalidates prior tokens                     |
| `isActive`                | Boolean                                 | Default: `true` (deactivation flag)          |

### Product Model

| Field           | Type                                | Notes                                    |
| --------------- | ----------------------------------- | ---------------------------------------- |
| `name`          | String (3-100 chars, text index)    | Required                                 |
| `description`   | String (10-2000 chars, text index)  | Required                                 |
| `price`         | Number (min 0)                      | Required                                 |
| `discountPrice` | Number (optional, must be < price)  | Validated                                |
| `category`      | Enum (9 values)                     | electronics, fashion, home, beauty, ...  |
| `images`        | [String]                            | Cloudinary URLs                          |
| `stock`         | Number (min 0)                      | Required                                 |
| `seller`        | ObjectId → User                     | Required (links to seller user)          |
| `averageRating` | Number (0-5)                        | Recalculated on review changes           |
| `totalReviews`  | Number                              | Updated via aggregation                  |
| `isActive`      | Boolean                             | Soft-delete flag                         |

### Order Model

| Field             | Type                                                   | Notes                                  |
| ----------------- | ------------------------------------------------------ | -------------------------------------- |
| `user`            | ObjectId → User                                        | Required                               |
| `items`           | [{ product, name, price, quantity, image }]            | Snapshot at purchase time (embedded)   |
| `shippingAddress` | Embedded sub-doc                                       | fullName, phone, street, city, etc.    |
| `subtotal`        | Number (min 0)                                         |                                        |
| `shipping`        | Number (min 0)                                         | ₹0 if subtotal ≥ 500, else ₹49         |
| `totalPrice`      | Number (min 0)                                         |                                        |
| `status`          | `pending \| confirmed \| shipped \| delivered \| cancelled` | State machine                      |
| `paymentStatus`   | `pending \| paid \| failed \| refund_pending \| refunded` |                                   |
| `paymentMethod`   | `razorpay \| cod`                                      |                                        |
| `razorpayOrderId` | String                                                  | Razorpay payment intent ID             |
| `razorpayPaymentId` | String (unique sparse index)                         | For idempotency                        |

### Cart Model

- `user`: ObjectId → User (unique — one cart per user)
- `items`: [{ product, quantity, price }] (no `_id` on sub-items)
- `totalPrice`: Number (recalculated via `calculateTotal()` method)

### Review Model

- `product`: ObjectId → Product
- `user`: ObjectId → User
- `rating`: 1-5
- `title`: String (max 80 chars, optional)
- `comment`: String (10-500 chars)
- **Compound unique index**: `{ product, user }` — one review per user per product

### Wishlist Model

- `user`: ObjectId → User (unique)
- `items`: [{ product, addedAt }]
- `shareId`: String (unique sparse index, generated on-demand)
- `shareEnabled`: Boolean (default: false)

### Indexing Strategy

| Collection | Indexes                                                           |
| ---------- | ----------------------------------------------------------------- |
| User       | `email` (unique sparse), `googleId` (unique sparse), `sellerStatus` |
| Product    | `category`, `seller`, `{name, description}` (text), `isActive`+`category` |
| Order      | `user`, `status`, `paymentStatus`, `razorpayOrderId`, `razorpayPaymentId` (unique sparse), `createdAt` (-1) |

---

## API Architecture

### Endpoints Summary (~50 endpoints)

All endpoints are prefixed with `/api`.

#### Auth — `/api/auth`

| Method   | Path                | Auth            | Rate Limit     | Description                              |
| -------- | ------------------- | --------------- | -------------- | ---------------------------------------- |
| `GET`    | `/csrf-token`       | None            | General        | Returns CSRF token as cookie + JSON      |
| `POST`   | `/register`         | None            | 20/10min       | Create account, send verification email  |
| `GET`    | `/verify-email`     | None            | General        | Verify email with one-time token         |
| `POST`   | `/resend-verification` | None          | 5/10min        | Resend verification email                |
| `POST`   | `/login`            | None            | 20/10min       | Login, set httpOnly JWT cookies          |
| `POST`   | `/refresh`          | Cookie          | 60/10min       | Rotate refresh token, issue new access   |
| `GET`    | `/me`               | Cookie          | General        | Get current user                         |
| `POST`   | `/logout`           | Auth + CSRF     | General        | Clear cookies, invalidate refresh token  |
| `PATCH`  | `/change-password`  | Auth + CSRF     | General        | Change password, clear all sessions      |
| `POST`   | `/forgot-password`  | None            | 5/10min        | Send password reset email                |
| `POST`   | `/reset-password`   | None            | 5/10min        | Reset password using raw token           |
| `GET`    | `/google`           | None            | General        | Redirect to Google OAuth consent screen  |
| `GET`    | `/google/callback`  | None            | General        | Google OAuth callback                    |

#### Products — `/api/products`

| Method   | Path                     | Auth          | Description                                        |
| -------- | ------------------------ | ------------- | -------------------------------------------------- |
| `GET`    | `/`                      | None          | Paginated catalog (search, filters, sort, paginate) |
| `GET`    | `/recommendations`       | Optional      | AI recommendation engine (mode, productIds, limit) |
| `GET`    | `/:id`                   | None          | Single product detail                              |
| `POST`   | `/`                      | Seller        | Create product with image upload                   |
| `PATCH`  | `/:id`                   | Seller        | Update own product                                 |
| `DELETE` | `/:id`                   | Seller        | Soft-delete (isActive: false)                      |

#### Cart — `/api/cart`

| Method   | Path             | Auth      | Description                  |
| -------- | ---------------- | --------- | ---------------------------- |
| `GET`    | `/`              | Auth      | Get current user's cart      |
| `POST`   | `/add`           | Auth+CSRF | Add product to cart          |
| `PATCH`  | `/:productId`    | Auth+CSRF | Update item quantity         |
| `DELETE` | `/:productId`    | Auth+CSRF | Remove single item           |
| `DELETE` | `/`              | Auth+CSRF | Clear entire cart            |

#### Orders — `/api/orders`

| Method   | Path              | Auth              | Description                                        |
| -------- | ----------------- | ----------------- | -------------------------------------------------- |
| `POST`   | `/`               | Admin+Verified    | Place COD order (admin only)                       |
| `GET`    | `/`               | Auth              | List user's orders (paginated, default 10, `?page=`)|
| `GET`    | `/:id`            | Auth              | Single order (ownership-gated)                     |
| `PATCH`  | `/:id/status`     | Admin/Seller+CSRF | Update order status (state machine)                |

#### Payments — `/api/payments`

| Method   | Path             | Auth      | Description                               |
| -------- | ---------------- | --------- | ----------------------------------------- |
| `POST`   | `/create-order`  | Auth      | Create Razorpay payment intent            |
| `POST`   | `/verify`        | Auth      | Verify payment signature, create DB order |
| `POST`   | `/webhook`       | None*     | Razorpay server-to-server webhook         |

\*Webhook uses raw-body parser and HMAC-SHA256 signature verification instead of CSRF.

#### Reviews — `/api/reviews`

| Method   | Path              | Auth      | Description                    |
| -------- | ----------------- | --------- | ------------------------------ |
| `GET`    | `/:productId`     | None      | All reviews for a product      |
| `POST`   | `/:productId`     | Auth+CSRF | Create review (verified buyer) |
| `DELETE` | `/:id`            | Auth+CSRF | Delete own review              |

#### Wishlist — `/api/wishlist`

| Method   | Path                   | Auth      | Description              |
| -------- | ---------------------- | --------- | ------------------------ |
| `GET`    | `/`                    | Auth      | Get wishlist (auto-create) |
| `POST`   | `/add`                 | Auth      | Add product              |
| `DELETE` | `/remove/:productId`   | Auth      | Remove product           |
| `POST`   | `/move-to-cart`        | Auth+CSRF | Move all to cart         |
| `PATCH`  | `/share`               | Auth+CSRF | Toggle public sharing    |
| `GET`    | `/share/:shareId`      | None      | View public wishlist     |
| `POST`   | `/email`               | Auth+CSRF | Email wishlist to recipient |

#### Seller — `/api/seller`

| Method | Path         | Auth              | Description                |
| ------ | ------------ | ----------------- | -------------------------- |
| `POST` | `/apply`     | Customer+Verified | Submit seller application  |
| `GET`  | `/products`  | Seller+Verified   | Get own products (paginated, default 20, `?page=`) |

#### Admin — `/api/admin`

| Method   | Path                | Auth    | Description                                     |
| -------- | ------------------- | ------- | ----------------------------------------------- |
| `GET`    | `/analytics`        | Admin   | KPIs, 14-day revenue, top products, categories  |
| `GET`    | `/sellers`          | Admin   | List seller applications                        |
| `PATCH`  | `/sellers/:id`      | Admin   | Approve/reject seller application               |
| `GET`    | `/dashboard`        | Admin   | Dashboard metrics (revenue, orders, avg value)  |

### Response Shape

Every API response uses the `ApiResponse` class:

```typescript
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "..." }

// Validation error
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "..." }] }
```

Controllers return standard HTTP status codes:
- `200` — Success
- `201` — Created
- `400` — Bad request / validation error
- `401` — Unauthenticated
- `403` — Forbidden (wrong role, unverified email)
- `404` — Not found
- `429` — Rate limited
- `500` — Internal server error

---

## React Query Usage

### Query Key Structure

All server data is managed via TanStack Query. Query keys follow a hierarchical pattern:

| Domain            | Query Key Prefix                                        | Cache Strategy          |
| ----------------- | ------------------------------------------------------- | ----------------------- |
| Products          | `["products", "list", params]` / `["products", "detail", id]` | 2 min staleTime    |
| Cart              | `["cart"]`                                              | 1 min staleTime         |
| Orders            | `["orders", "list"]` / `["orders", "detail", id]`      | 1 min staleTime         |
| Wishlist          | `["wishlist"]` / `["wishlist", "share", shareId]`      | 1 min staleTime         |
| Reviews           | `["reviews", productId]`                                | 2 min staleTime         |
| Seller Products   | `["seller", "products"]`                                | 15 sec staleTime        |
| Admin Sellers     | `["admin", "sellers"]`                                  | 30 sec staleTime        |
| Admin Analytics   | `["admin", "analytics"]`                                | 1 min staleTime         |
| Recommendations   | `["recommendations", mode, productIds, limit]`          | 10 min staleTime        |

### Hook Pattern

Every domain has one file in `hooks/` that exports custom hooks wrapping `useQuery` and `useMutation`. The pattern is:

```typescript
// Pattern — example from useProducts.ts
export const useProducts = (params: ProductQueryParams) =>
  useQuery({
    queryKey: ["products", "list", params],
    queryFn: () => getProducts(params),
    staleTime: 1000 * 60 * 2,
  });

export const useCreateProduct = () =>
  useMutation({
    mutationFn: (data: ProductFormData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["seller", "products"] });
    },
  });
```

### Cache Invalidation Strategy

- Mutations invalidate related query groups to trigger refetch
- Product mutations invalidate both `["products"]` and `["seller", "products"]` lists
- Cart mutations invalidate `["cart"]` and related order queries
- Admin mutations invalidate the relevant admin query prefix

### Default QueryClient Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minute global default
    },
  },
});
```

---

## Zustand Usage

Zustand is used **only** for the auth store — a deliberate choice to keep client-side state minimal:

```typescript
// store/auth.store.ts
interface AuthState {
  user: User | null;
  isAuthLoading: boolean;

  setUser: (user: User) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;  // called once on app mount
}
```

- `user` — The current authenticated user object (or `null` when logged out)
- `isAuthLoading` — `true` while the boot-time `/auth/me` call resolves; guards against flash-of-unauthenticated-content
- `initAuth()` — Called once by `AuthGate` on mount. Calls `GET /auth/me`. On failure, sets `user: null`. Always sets `isAuthLoading: false` in the `finally` block
- `clearAuth()` — Called by:
  1. The Axios refresh interceptor when token refresh fails permanently
  2. The logout mutation after successful/logged server-side logout

All other state (server data) lives in React Query caches. No Redux, no additional Zustand stores.

---

## Security Architecture

### Layered Defense

| Layer            | Implementation                                                 |
| ---------------- | -------------------------------------------------------------- |
| Transport        | HTTP-only cookies (inaccessible to JavaScript)                 |
| Headers          | Helmet (XSS, clickjacking, MIME sniffing, HSTS)               |
| CORS             | Strict origin whitelist with credential support                |
| Body Size        | 10KB JSON limit                                                |
| NoSQL Injection  | Custom `mongoSanitize` middleware strips `$` and `.` from keys |
| Rate Limiting    | 4 tiers: general (100), auth (20), password-reset (5), refresh (60) per 10 min |
| CSRF             | Double-submit cookie pattern with `crypto.timingSafeEqual`     |
| Auth             | JWT from httpOnly cookie, verified on every request            |
| Input Validation | Zod schema-first validation on all state-changing requests     |
| File Uploads     | MIME validation, 5MB limit, memory-only storage (no disk)      |
| Webhook          | HMAC-SHA256 signature verification on raw request body         |

### CSRF Protection (Double-Submit Cookie Pattern)

```
1. GET /auth/csrf-token
   → Sets csrfToken as non-httpOnly cookie (JS must read via document.cookie)
   → No CSRF token in response body (cookie is the source of truth)

2. Frontend Axios interceptor reads the cookie on first non-GET request
   → Caches it in memory (csrfToken variable)

3. Every mutating request (POST/PATCH/DELETE):
   → Attaches x-csrf-token header with the cached value

4. Global csrfProtection middleware (app.ts — single enforcement point):
   → Compares x-csrf-token header against csrfToken cookie
   → Uses crypto.timingSafeEqual (timing-safe comparison)
   → If mismatch → 403

5. Why non-httpOnly is correct:
   - CSRF token defeats cross-origin requests, not XSS
   - If an attacker has XSS, httpOnly cookies don't help (real secrets: accessToken/refreshToken are httpOnly)
   - Attacker's cross-origin request cannot read the csrfToken cookie (Same-Origin Policy)
   - So the attacker cannot set the x-csrf-token header correctly → request rejected
```

### JWT Token Architecture

```
Access Token:
  - Payload: { userId, role, jti (uuid), iat, exp }
  - Expiry: 15 minutes
  - Stored in: httpOnly cookie named "accessToken"
  - Verified on every protected request

Refresh Token:
  - Payload: { userId, iat, exp }
  - Expiry: 7 days
  - Stored in: httpOnly cookie named "refreshToken"
  - HMAC-SHA256 hashed value stored in DB
  - Rotated on every use (new token issued, old one invalidated)

Reuse Detection:
  If a used refresh token is replayed:
  → All user sessions are invalidated (clears all stored refresh tokens)
  → Forces re-login on all devices
```

### Password Security

- bcrypt with 12 salt rounds
- Verification/reset tokens: SHA-256 hashed before storage (raw never persisted)
- `passwordChangedAt` timestamp invalidates all prior tokens
- Rate-limited password reset endpoints (5 req / 10 min)

---

## Checkout Flow

### Razorpay Payment Flow

```
CART PAGE                     FRONTEND                    BACKEND                      RAZORPAY
   │                             │                          │                             │
   │  User fills address +       │                          │                             │
   │  clicks "Place Order"       │                          │                             │
   │────────────────────────────►│                          │                             │
   │                             │  POST /payments/create-order                           │
   │                             │  { shippingAddress }     │                             │
   │                             │─────────────────────────►│                             │
   │                             │                          │  Validate shippingAddress   │
   │                             │                          │  Calculate total server-side│
   │                             │                          │  (NEVER trust frontend)     │
   │                             │                          │  Validate stock             │
   │                             │                          │  Create Razorpay order      │
   │                             │                          │────────────────────────────►│
   │                             │                          │◄── { order_id, amount }    │
   │                             │                          │                             │
   │                             │                          │  Save pending Order to DB   │
   │                             │                          │  (with shippingAddress,     │
   │                             │                          │   status: "pending",        │
   │                             │                          │   paymentStatus: "pending") │
   │                             │                          │                             │
   │                             │◄── { orderId, keyId,    │                             │
   │                             │      subtotal, shipping, │                             │
   │                             │      total }             │                             │
   │                             │                          │                             │
   │                             │  Load Razorpay popup     │                             │
   │                             │  (dynamically loads      │                             │
   │                             │   checkout.razorpay.com  │                             │
   │                             │   /v1/checkout.js)       │                             │
   │◄── Razorpay popup opens ────│                          │                             │
   │                             │                          │                             │
   │  User completes payment     │                          │                             │
   │────────────────────────────►│                          │                             │
   │                             │  POST /payments/verify   │                             │
   │                             │  { razorpayOrderId,      │                             │
   │                             │    razorpayPaymentId,    │                             │
   │                             │    razorpaySignature }   │                             │
   │                             │─────────────────────────►│                             │
   │                             │                          │  Wait 10s (anti-race)      │
   │                             │                          │  Verify HMAC-SHA256 sig     │
   │                             │                          │  Check idempotency          │
   │                             │                          │  Find + confirm pending     │
   │                             │                          │  order                      │
   │                             │                          │  Decrement stock            │
   │                             │                          │  Clear cart                 │
   │                             │                          │                             │
   │                             │◄── { orderId }           │                             │
   │                             │                          │                             │
   │  Redirect to /payment-success                           │                             │
   │◄────────────────────────────│                          │                             │
```

### Webhook Recovery (Tab-Close Path)

If the user's tab is closed after payment but before `/verify` completes:

```
Razorpay                    BACKEND
   │                          │
   │  POST /payments/webhook  │
   │  (payment.captured)      │
   │─────────────────────────►│
   │                          │  Verify HMAC-SHA256 signature
   │                          │  (raw request body)
   │                          │
   │                          │  Check idempotency — skip if
   │                          │  /verify already processed this
   │                          │
   │                          │  Find pending order by
   │                          │  razorpayOrderId (saved in
   │                          │  create-order step with full
   │                          │  shippingAddress)
   │                          │
   │                          │  Confirm order:
   │                          │  ├── status → "confirmed"
   │                          │  ├── paymentStatus → "paid"
   │                          │  ├── attach razorpayPaymentId
   │                          │  ├── decrement stock
   │                          │  └── clear cart
   │                          │
   │◄── 200 { received: true }│
```

### Atomic Checkout (MongoDB Transaction)

The `placeOrderService` wraps three operations in a MongoDB transaction:

1. **Stock decrement**: `findOneAndUpdate` with `{ stock: { $gte: item.quantity } }` atomic guard
2. **Order creation**: Snapshots cart items with current prices
3. **Cart clearing**: Resets items + totalPrice

If any step fails (insufficient stock, product deactivated), `session.abortTransaction()` rolls everything back atomically.

### Idempotency

- `razorpayPaymentId` has a unique sparse index on the Order collection
- The `/verify` endpoint checks for existing orders with the same payment ID before creating a new one
- Prevents duplicate orders if the client retries the verify request

### Webhook Safety Net

If the user closes the browser tab after payment but before `/verify` completes, Razorpay's server-to-server webhook (`payment.captured`) catches it. The webhook handler:
1. Verifies HMAC-SHA256 signature on the raw request body
2. Checks idempotency (skips if `/verify` already processed this payment)
3. Finds the pending order by `razorpayOrderId` (saved in `createRazorpayOrder` with full shipping address)
4. Confirms the order (updates status + paymentStatus)
5. Atomically decrements stock for each item
6. Clears the user's cart

This works because `createRazorpayOrder` now saves the pending Order to MongoDB (with `shippingAddress`) **before** the user sees the Razorpay popup, so the webhook always has everything it needs.

### Shipping Policy

- Free shipping for subtotals ≥ ₹500
- ₹49 shipping charge for subtotals below ₹500
- Both the `/payments/create-order` controller and `order.service.ts` independently calculate shipping (defense in depth)

---

## Recommendation Engine

The recommendation system in `services/recommendation.service.ts` is a **heuristic engine** with no external ML dependencies. It implements four strategies:

### Strategy 1: Related Products (Content-Based)

```
Input: current product ID
Method: Jaccard similarity on name/description tokens + rating score
Formula: score = tokenSimilarity × 0.7 + (averageRating / 5) × 0.3
Output: top-N scored products from the same category
```

### Strategy 2: Frequently Bought Together (Co-Occurrence)

```
Input: current product ID
Method: Analyzes Order collection for orders containing this product
         Counts weighted co-occurrences (quantity matters — 3 units = stronger signal)
Fallback: Strategy 1 if no co-occurrence data exists
```

### Strategy 3: Cart Recommendations (Cross-Category Discovery)

```
Input: list of product IDs in cart
Method: Cross-category discovery — find products NOT in the same category as cart
         Uses co-occurrence data first, then top-rated cross-category
Fallback: Top-rated excluding cart items
```

### Strategy 4: Personalized Recommendations (Interest Graph)

```
Input: user ID
Method: Builds category affinity graph:
         - Cart items: 3× weight per occurrence
         - Wishlist items: 2× weight per occurrence
         - Order items: 1× weight per occurrence
         Scores candidates by: affinity × 2.0 + (rating / 5) × 1.5
         Pads with top-rated if not enough candidates
Fallback: Top-rated if no interaction history
```

Every recommended product includes a **human-readable reason string** (e.g., "Frequently bought together", "Top rated in Electronics") displayed alongside each card on the frontend.

---

## Error Handling

### Backend

**Async Handler Wrapper:**

```typescript
// utils/asyncHandler.ts
export const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
```

All async controller functions are wrapped with `asyncHandler`. Any thrown error is caught and forwarded to the Express global error handler — no `try/catch` needed in individual controllers.

**Global Error Handler (`app.ts`):**

```typescript
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  Logger.error("Unexpected error:", err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});
```

- Known errors (`ApiError`) → structured JSON with appropriate status code
- Unexpected errors → 500 with generic message (logged server-side)
- Zod validation errors → 400 with field-level error details

**Error Categories:**

| Error Type       | Where Thrown              | HTTP Status | Response Shape                          |
| ---------------- | ------------------------- | ----------- | --------------------------------------- |
| Validation       | `validate` middleware     | 400         | `{ success, message, errors[] }`        |
| Authentication   | `verifyToken` middleware   | 401         | `{ success, message }`                  |
| Authorization    | `requireRole`, ownership checks | 403    | `{ success, message }`                  |
| Not Found        | Controllers               | 404         | `{ success, message }`                  |
| Rate Limit       | Rate limiter              | 429         | `{ success, message }`                  |
| Business Logic   | Services                  | 400         | `{ success, message }` (out of stock, etc.) |

### Frontend

**Axios Response Interceptor (401 handling):**

1. Catches all HTTP 401 responses
2. If not already refreshing, calls `POST /auth/refresh`
3. Queues concurrent failed requests during refresh
4. On refresh success: retries all queued requests, then the original
5. On refresh failure: calls `clearAuth()`, rejects all queued requests

**React Query Error Handling:**

- Queries with `retry: 1` — one automatic retry on failure
- Mutations handle errors in the `onError` callback to show toast notifications
- The `getApiErrorMessage` utility extracts the best available error message from the API response

### Server Lifecycle

**`server.ts`** manages process-level resilience:

- **Graceful shutdown** — `SIGTERM`/`SIGINT` handlers call `server.close()` and drain in-flight requests before exiting. A 10-second forced-exit timeout prevents hanging.
- **Unhandled rejections** — `process.on('unhandledRejection')` logs the error with stack trace so async failures outside the middleware chain are visible.
- **Uncaught exceptions** — `process.on('uncaughtException')` logs and exits with code 1, preventing the process from continuing in an unknown state.

---

## Logging

### Backend

Two logging systems operate in parallel:

**1. HTTP Request Logging (Morgan)**

- Production: `combined` format (Apache-style, includes remote addr, user-agent, referrer)
- Development: `dev` format (colored, concise)

**2. Structured Logger (`utils/logger.ts`)**

Custom logger with leveled output and color-coded console formatting:

```typescript
Logger.error("message", meta?)    // Red — only logs in production
Logger.warn("message", meta?)     // Yellow
Logger.info("message", meta?)     // Green
Logger.http("message", meta?)     // Cyan
Logger.debug("message", meta?)    // Magenta — only in development
```

- Level filtering: `production` logs only `error` and `warn`; `development` logs all levels
- Log format: `[timestamp] [LEVEL] message { "json": "metadata" }`
- `error` → `console.error`, `warn` → `console.warn`, others → `console.log`

**3. Audit Logger (`utils/auditLogger.ts`)**

Security-event specific logging on top of the structured logger:

```typescript
type AuditAction =
  | "auth.login" | "auth.logout" | "auth.refresh"
  | "auth.password_change" | "auth.password_reset_completed"
  | "auth.email_verify"
  | "seller.apply" | "seller.approve" | "seller.reject"
  | "admin.access";

auditLog("auth.login", userId, { ip: req.ip });
```

All audit events are logged at `warn` level (always visible in production).

### Frontend

No structured logging on the frontend. Error visibility is through:
- Sonner toast notifications for user-facing errors
- React Query devtools in development
- Browser console for Axios errors

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                     | Required | Purpose                                |
| ---------------------------- | -------- | -------------------------------------- |
| `PORT`                       | Yes      | Server port (default: 5000)            |
| `NODE_ENV`                   | Yes      | `development` / `production`           |
| `MONGO_URI`                  | Yes      | MongoDB Atlas connection string        |
| `ACCESS_TOKEN_SECRET`        | Yes      | JWT signing (min 32 chars in prod)     |
| `REFRESH_TOKEN_SECRET`       | Yes      | JWT refresh signing (min 32 chars)     |
| `REFRESH_TOKEN_HASH_SECRET`  | Yes      | HMAC secret for hashing refresh tokens |
| `FRONTEND_URL`               | Yes      | CORS origin + redirect URLs            |
| `GOOGLE_CLIENT_ID`           | Yes      | Google OAuth client ID                 |
| `GOOGLE_CLIENT_SECRET`       | Yes      | Google OAuth client secret             |
| `GOOGLE_CALLBACK_URL`        | Yes      | OAuth redirect URI                     |
| `CLOUDINARY_CLOUD_NAME`      | Yes      | Cloudinary cloud name                  |
| `CLOUDINARY_API_KEY`         | Yes      | Cloudinary API key                     |
| `CLOUDINARY_API_SECRET`      | Yes      | Cloudinary API secret                  |
| `RESEND_API_KEY`             | No       | Transactional emails                   |
| `RESEND_FROM_EMAIL`          | No       | Verified sender email                  |
| `ADMIN_EMAIL`                | No       | Seller application notifications       |
| `RAZORPAY_KEY_ID`            | No       | Razorpay payment API key               |
| `RAZORPAY_KEY_SECRET`        | No       | Razorpay payment API secret            |
| `RAZORPAY_WEBHOOK_SECRET`    | No       | Webhook signature secret               |
| `EMAIL_VERIFICATION_DEMO_MODE` | No     | `true` returns demo URL in API response |

Env validation (`config/validateEnv.ts`) checks for required variables on startup and exits with an error message if any are missing. In production, it additionally enforces JWT secrets ≥ 32 characters.

### Frontend (`frontend/.env`)

| Variable         | Purpose                       |
| ---------------- | ----------------------------- |
| `VITE_API_URL`   | Backend API base URL          |

---

## Deployment

### Current Status

- **Frontend**: Deployed on Vercel (`snapcart-now.vercel.app`)
- **Backend**: Deployed on Railway (`snapcart-production.up.railway.app`)

### Deploy Scripts

**Backend (`backend/package.json`):**

| Script           | Command                                      | Purpose                |
| ---------------- | -------------------------------------------- | ---------------------- |
| `dev`            | `ts-node-dev --respawn --transpile-only src/server.ts` | Development server |
| `build`          | `tsc`                                        | TypeScript compilation |
| `start`          | `node dist/server.js`                        | Production start       |
| `db:seed:dev`    | `ts-node src/scripts/seed.dev.ts`            | Seed test data         |
| `lint`           | `eslint src`                                 | Linting                |
| `type-check`     | `tsc --noEmit`                               | Type checking          |

**Frontend (`frontend/package.json`):**

| Script     | Command              | Purpose              |
| ---------- | -------------------- | -------------------- |
| `dev`      | `vite`               | Development server   |
| `build`    | `tsc -b && vite build` | Production build   |
| `preview`  | `vite preview`       | Preview production   |
| `lint`     | `eslint .`           | Linting              |

### Seed Data

```typescript
// backend/src/scripts/seed.dev.ts
Users:
  - admin@snapcart.test / password123   → role: admin
  - seller@snapcart.test / password123  → role: seller (approved)
  - shopper@snapcart.test / password123 → role: customer

Products: 12 products across 6 categories
  - electronics (3): wireless headphones, smartphone, bluetooth speaker
  - gaming (2): mechanical keyboard, gaming mouse
  - fashion (3): running shoes, denim jacket, smart watch (cross-category)
  - home (2): coffee maker, throw pillow set
  - beauty (2): skincare kit, perfume
```

---

## Coding Conventions

### Backend

- **Controller → Service → Model** layering. Controllers are thin (call service, return response). Services contain business logic. Models define schema + indexes only.
- **Zod validation** at the route boundary in dedicated `validators/` files. Schemas are not co-located with controllers.
- **Thrown errors** use the `ApiError` class with appropriate HTTP status code. Handled by the global error handler.
- **Async controllers** wrapped with `asyncHandler` — no manual `try/catch` in controllers.
- **Select: false** on sensitive fields (password, tokens, refreshToken). Explicit `.select("+field")` when needed.
- **Indexes** defined on the schema alongside field definitions for discoverability.

### Frontend

- **One hook file per domain** in `hooks/`. Hooks export `useQuery` and `useMutation` wrappers.
- **One API file per domain** in `api/`. Plain async functions — no Axios instance dependency.
- **Zustand only for auth** — all server state via React Query.
- **URL as source of truth** for filters on catalog pages (no local filter state).
- **Lazy loading** via `React.lazy()` + `Suspense` for all page components.
- **All pages** rendered via route-level lazy imports in `App.tsx`.
- **shadcn/ui primitives** in `components/ui/` — customized via Tailwind classes, not theme config.

### TypeScript

- TypeScript 6 throughout both projects.
- Backend types in `types/` (interfaces prefixed with `I`: `IUser`, `IProduct`).
- Frontend types in `types/` (plain PascalCase: `User`, `Product`).
- Shared validation logic via Zod schemas in `schemas/` (frontend) and `validators/` (backend) — schemas are duplicated, not shared via a package.

---

## Known Technical Debt

### 1. TypeScript Module Conflicts

Both `backend/package.json` and `frontend/package.json` list conflicting TypeScript versions:
- `"typescript": "^6.0.3"` (backend) and `"typescript": "~6.0.2"` (frontend)
- `"@types/express": "^5.0.6"` is listed as a dependency but Express 5 types ship with the package itself

### 2. Duplicate bcrypt Packages

`backend/package.json` lists both `"bcrypt": "^6.0.0"` and `"bcryptjs": "^3.0.3"`. Only `bcryptjs` is used in the codebase (the pure-JS version, no native compilation needed). The `bcrypt` native package is unused.

### 3. Unused Dependencies

- `express-validator` — Zod is used for validation; express-validator is not imported anywhere
- `shadcn` on the frontend — the CLI tool, not a runtime dependency
- `react-is` — likely a transitive dependency listed explicitly

### 4. Seller Dashboard Route

The seller dashboard route (`/seller/dashboard`) is commented out in `App.tsx`. The `SellerDashboardPage` lazy import is also commented out.

### 5. StatusBar Component

The rotating USP bar (`StatusBar`) is imported in `Header.tsx` but commented out — not rendered.

### 6. COD Order Route

The COD (Cash on Delivery) order placement (`POST /orders`) requires admin role — meaning customers cannot place COD orders through the API. Only Razorpay payment flow is available to customers.

### 7. Webhook Incomplete Checkout Handling (Fixed)

The Razorpay webhook handler (`payment.captured`) previously logged paid-but-unordered transactions for manual reconciliation. **Fixed:** `createRazorpayOrder` now saves the pending Order with `shippingAddress` to MongoDB before the Razorpay popup opens. The webhook can find and confirm the order atomically — decrementing stock and clearing the cart. No manual reconciliation needed.

### 8. No Automated Tests

Both `package.json` files have placeholder test scripts:
- Backend: `"test": "echo \"Error: no test specified\" && exit 1"`
- Frontend: No test script at all (no test dependencies installed)

### 9. Zod Schema Duplication

Validation schemas are duplicated between backend `validators/` and frontend `schemas/`. There's no shared types package.

### 10. inconsistent Seed Script

The seed script at `backend/src/scripts/seed.dev.ts` creates test users with plain-text password "password123" — acceptable for development only.

---

## Suggested Improvements

### Critical

1. **Add test suites** — Unit tests for services (Jest/Vitest), integration tests for API endpoints, E2E tests for critical flows (auth, checkout). This is the biggest gap.
2. **Remove unused bcrypt dependency** — Keep only `bcryptjs`, remove `bcrypt` to eliminate unnecessary native compilation.
3. **Fix TypeScript version alignment** — Use the same TypeScript version across both packages.

### High Priority

4. **Shared types package** — Extract Zod schemas + TypeScript interfaces into a shared package (or workspace package) to eliminate duplication between frontend and backend.
5. **Implement COD checkout** — Enable customer-facing COD order placement (currently admin-only).
6. **Complete webhook order creation** — Store shipping address server-side (e.g., in a temporary cache keyed by Razorpay order ID) so the webhook can create complete orders.
7. **Add admin product/order management UI** — Admin seller/analytics pages exist, but product and order management actions are mock-only.

### Medium Priority

8. **Uncomment seller dashboard** — Restore the seller dashboard route and implement analytics for sellers.
9. **Add product filtering shortcuts** — Enable the `StatusBar` with rotating promotional messages.
10. **Error monitoring** — Integrate Sentry or similar for production error tracking.
11. **CI/CD pipeline** — Add lint + type-check to GitHub Actions; consider adding test runner.

### Nice-to-Have

12. **Full-text search** — Replace basic regex search with MongoDB Atlas Search for better relevance.
13. **WebSocket notifications** — Real-time order status updates (shipped → delivered) for buyers, new order alerts for sellers.
14. **Coupon/discount system** — Admin-configurable promo codes with percentage/flat discounts.
15. **Image optimization** — Add sharp/resize pipeline before Cloudinary upload for smaller payloads.
16. **Rate-limited account lockout** — Lock accounts after N failed login attempts (currently only IP-based rate limiting).
17. **Refresh token expiry cleanup** — Background job to remove expired refresh tokens from the database.
