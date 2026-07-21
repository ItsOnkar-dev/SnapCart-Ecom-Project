<div align="center">

# 🎨 SnapCart — Frontend

### React SPA for a multi-vendor e-commerce platform

_React 19 · Vite · TypeScript · Tailwind CSS v4 · shadcn/ui · React Query · Zustand_

<br/>

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4)](https://tailwindcss.com/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)

<br/>

[**◀ Back to Root**](../README.md) · [**⚙️ Backend Docs**](../backend/README.md) · [**🐛 Report Bug**](https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project/issues) · [**✨ Request Feature**](https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project/issues)

</div>

---

## 📋 Table of Contents

- [🎨 SnapCart — Frontend](#-snapcart--frontend)
  - [React SPA for a multi-vendor e-commerce platform](#react-spa-for-a-multi-vendor-e-commerce-platform)
  - [📋 Table of Contents](#-table-of-contents)
  - [✨ Highlights](#-highlights)
  - [🛠 Tech Stack](#-tech-stack)
  - [🔄 Data Flow](#-data-flow)
  - [✅ Prerequisites](#-prerequisites)
  - [🚀 Setup and Installation](#-setup-and-installation)
  - [⚙️ Environment Variables](#️-environment-variables)
  - [📜 Available Scripts](#-available-scripts)
  - [📁 Project Structure](#-project-structure)
  - [🗺 Routing](#-routing)
    - [Route Table](#route-table)
  - [🗄 State Management](#-state-management)
  - [🌐 API Layer](#-api-layer)
  - [✨ Key Features](#-key-features)
    - [🔐 Authentication](#-authentication)
    - [🛍️ Product Catalog](#️-product-catalog)
    - [🛒 Cart and Checkout](#-cart-and-checkout)
    - [💝 Wishlist](#-wishlist)
    - [🏪 Seller Dashboard](#-seller-dashboard)
    - [📊 Admin Dashboard](#-admin-dashboard)
  - [🚢 Deployment](#-deployment)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

---

## ✨ Highlights

```
✅ React 19              Concurrent rendering with Suspense-based lazy loading for all routes
✅ httpOnly session      No tokens in localStorage — cookies managed server-side
✅ CSRF + refresh        Axios interceptors handle token injection and silent session refresh
✅ React Query           Automatic caching, background refetch, and optimistic updates
✅ Zustand auth store    Minimal global state — only authentication; all else is server state
✅ Zod form schemas      Same validation library as the backend for consistent rules
✅ shadcn/ui             Accessible Radix UI primitives with Tailwind CSS v4 styling
✅ Role-based routing    ProtectedRoute + RoleRoute guards enforce buyer / seller / admin access
✅ Recharts dashboard    Interactive admin analytics rendered from MongoDB aggregation data
✅ Razorpay checkout     Full payment flow with order creation and payment confirmation
```

---

## 🛠 Tech Stack

| Category      | Library / Tool                    | Purpose                                      |
| ------------- | --------------------------------- | -------------------------------------------- |
| Framework     | React 19                          | Concurrent rendering, Suspense               |
| Build Tool    | Vite 8                            | Fast HMR, native ESM, `@` path alias         |
| Language      | TypeScript 6                      | Full type safety, strict mode                |
| Styling       | Tailwind CSS v4                   | CSS-first config via `@tailwindcss/vite`     |
| Components    | shadcn/ui + Radix UI              | Accessible, composable primitives            |
| Routing       | React Router v7                   | File-based-style route definitions           |
| Server State  | TanStack React Query v5           | Caching, background sync, mutations          |
| Global State  | Zustand v5                        | Minimal auth store (user + isAuthLoading)    |
| HTTP Client   | Axios v1                          | CSRF injection + silent refresh interceptors |
| Forms         | React Hook Form + Zod             | Schema-first, performant form handling       |
| Charts        | Recharts v3                       | Admin analytics dashboards                   |
| Icons         | HugeIcons + Lucide React          | Consistent icon system                       |
| Notifications | Sonner                            | Non-blocking toast notifications             |
| Fonts         | Figtree Variable · Geist Variable | Variable fonts via `@fontsource-variable`    |
| Payments      | Razorpay Web SDK                  | In-browser checkout flow                     |
| Linting       | ESLint 10 + typescript-eslint     | Strict TypeScript-aware linting              |

---

## 🔄 Data Flow

Understanding how a user action reaches the server and updates the UI:

```
User Action (click, form submit)
        │
        ▼
  React Component
        │  calls
        ▼
  Custom Hook (src/hooks/use*.ts)
  e.g. useCart, useProducts, useWishlist
        │  wraps with useQuery / useMutation
        ▼
  React Query
        │  on cache miss or mutation
        ▼
  API Function (src/api/*.api.ts)
  e.g. cart.api.ts → addToCart()
        │  calls
        ▼
  Axios Instance (src/lib/axios.ts)
        │
        ├── Request interceptor
        │     └── Fetch CSRF token → attach x-csrf-token header
        │
        ├── POST / PATCH / DELETE → Backend API
        │
        └── Response interceptor
              └── 401? → POST /auth/refresh → retry original request
                       → Still 401? → clearAuth() + redirect /login
        │
        ▼
  React Query cache updated
        │
        ▼
  Component re-renders with new data
```

---

## ✅ Prerequisites

| Tool    | Version      |
| ------- | ------------ |
| Node.js | 20 or higher |
| npm     | 10 or higher |

> The SnapCart backend must be running. See [`backend/README.md`](../backend/README.md) for setup instructions.

---

## 🚀 Setup and Installation

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create environment file
echo "VITE_API_URL=http://localhost:5000" > .env

# 4. Start the development server
npm run dev
```

The app will be available at **`http://localhost:5173`**.

---

## ⚙️ Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# URL of the running SnapCart backend API (no trailing slash)
VITE_API_URL=http://localhost:5000
```

> All Vite environment variables must be prefixed with `VITE_` to be accessible in the browser bundle. The value is **inlined at build time**, so set this correctly before running `npm run build` for production.

---

## 📜 Available Scripts

Run these from the `frontend/` directory:

| Script               | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | Start Vite dev server with HMR at `http://localhost:5173` |
| `npm run build`      | Type-check then bundle for production into `dist/`        |
| `npm run preview`    | Serve the production build locally for final verification |
| `npm run lint`       | Run ESLint across all TypeScript/TSX files                |
| `npm run type-check` | Run `tsc --noEmit` without emitting files                 |

---

## 📁 Project Structure

```
frontend/
├── public/
│   ├── assets/              # Static images (hero.png, etc.)
│   ├── favicon.svg
│   └── icons.svg            # SVG sprite
│
├── src/
│   ├── api/                 # Plain async functions — one file per domain
│   │   ├── auth.api.ts      # Login, register, logout, verify, reset
│   │   ├── cart.api.ts      # Get, add, update, remove, clear
│   │   ├── order.api.ts     # Place, list, detail, status update
│   │   ├── product.api.ts   # List (with params), get, create, update, delete
│   │   ├── wishlist.api.ts  # CRUD + share + email
│   │   ├── payment.api.ts   # Razorpay integration
│   │   ├── review.api.ts    # List + submit + delete
│   │   ├── seller.api.ts    # Apply + list pending + update status
│   │   ├── admin.api.ts     # Seller moderation
│   │   ├── analytics.api.ts # Admin dashboard metrics
│   │   └── recommendation.api.ts
│   │
│   ├── components/
│   │   ├── home/            # Homepage sections
│   │   │   ├── Hero.tsx
│   │   │   ├── DepartmentGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductRail.tsx
│   │   │   ├── RecommendedProducts.tsx
│   │   │   ├── SellerCTA.tsx
│   │   │   └── TrustBar.tsx
│   │   ├── layout/          # Shell — header, footer, auth layout
│   │   │   ├── header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── AuthHeader.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── SearchAutocomplete.tsx
│   │   │   │   ├── StatusBar.tsx
│   │   │   │   └── UserMenu.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/              # shadcn/ui primitive components
│   │   ├── AuthGate.tsx     # Calls initAuth() once on mount
│   │   └── Logo.tsx
│   │
│   ├── hooks/               # React Query hooks — one per domain
│   │   ├── useAuth.ts       # Login, logout, register mutations
│   │   ├── useCart.ts       # Cart queries and mutations
│   │   ├── useOrders.ts     # Order list, detail, status
│   │   ├── useProducts.ts   # Catalog query, product detail
│   │   ├── useWishlist.ts   # Wishlist CRUD + share
│   │   ├── useReviews.ts    # Reviews list + submit
│   │   ├── useRecommendations.ts
│   │   ├── useSellerProducts.ts
│   │   ├── useAdmin.ts
│   │   ├── useAnalytics.ts
│   │   └── usePayment.ts
│   │
│   ├── lib/
│   │   ├── axios.ts         # Axios instance: base URL + CSRF + refresh interceptors
│   │   └── utils.ts         # cn() — Tailwind class merging
│   │
│   ├── pages/
│   │   ├── auth/            # Login · Register · ForgotPassword · ResetPassword · VerifyEmail
│   │   ├── product/         # ProductsPage · ProductDetailPage
│   │   ├── cart/            # CartPage
│   │   ├── order/           # OrdersPage · OrderDetailPage
│   │   ├── wishlist/        # WishlistPage · WishlistSharePage (public)
│   │   ├── profile/         # ProfilePage
│   │   ├── payment/         # PaymentSuccess
│   │   ├── seller/          # SellerApplyPage · SellerProductsPage
│   │   ├── admin/           # AdminSellersPage · AdminAnalyticsDashboard
│   │   ├── error/           # NotFound · Unauthorized
│   │   └── HomePage.tsx
│   │
│   ├── router/
│   │   ├── ProtectedRoute.tsx   # Redirects unauthenticated users to /login
│   │   └── RoleRoute.tsx        # Redirects on role mismatch to /unauthorized
│   │
│   ├── schemas/             # Zod schemas for form validation
│   │   ├── auth.schema.ts
│   │   ├── cart.schema.ts
│   │   ├── product.schema.ts
│   │   └── review.schema.ts
│   │
│   ├── store/
│   │   └── auth.store.ts    # Zustand: user · isAuthLoading · setUser · clearAuth · initAuth
│   │
│   ├── types/               # TypeScript interfaces mirroring backend models
│   │
│   ├── App.tsx              # Route definitions
│   ├── index.css            # Tailwind base + custom CSS variables
│   └── main.tsx             # Entry point — QueryClient · AuthGate · Toaster · Suspense
│
├── components.json          # shadcn/ui configuration
├── vite.config.ts           # Vite config: react plugin + tailwind + @ alias
├── tsconfig.json
└── package.json
```

---

## 🗺 Routing

All routes are defined in `src/App.tsx`. The app uses two primary layouts:

| Layout       | Purpose                                          |
| ------------ | ------------------------------------------------ |
| `AuthLayout` | Centred single-column layout for auth forms      |
| `MainLayout` | Full shell with Header, Footer, and `<Outlet />` |

### Route Table

| Path                       | Access         | Page                    |
| -------------------------- | -------------- | ----------------------- |
| `/`                        | Public         | HomePage                |
| `/products`                | Public         | ProductsPage            |
| `/products/:id`            | Public         | ProductDetailPage       |
| `/wishlist/share/:shareId` | Public         | WishlistSharePage       |
| `/unauthorized`            | Public         | Unauthorized            |
| `/login`                   | Guest only     | LoginPage               |
| `/register`                | Guest only     | RegisterPage            |
| `/forgot-password`         | Guest only     | ForgotPasswordPage      |
| `/verify-email`            | Guest only     | VerifyEmailPage         |
| `/reset-password`          | Guest only     | ResetPasswordPage       |
| `/cart`                    | Auth required  | CartPage                |
| `/orders`                  | Auth required  | OrdersPage              |
| `/orders/:id`              | Auth required  | OrderDetailPage         |
| `/profile`                 | Auth required  | ProfilePage             |
| `/wishlist`                | Auth required  | WishlistPage            |
| `/payment-success`         | Auth required  | PaymentSuccess          |
| `/seller/apply`            | Auth required  | SellerApplyPage         |
| `/seller/products`         | Seller / Admin | SellerProductsPage      |
| `/admin/sellers`           | Admin only     | AdminSellersPage        |
| `/admin/analytics`         | Admin only     | AdminAnalyticsDashboard |

**Route guards:**

- `ProtectedRoute` — redirects unauthenticated users to `/login`
- `RoleRoute` — checks `user.role`; redirects to `/unauthorized` on mismatch

---

## 🗄 State Management

Global authentication state is managed with **Zustand** (`src/store/auth.store.ts`):

| State / Action  | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `user`          | Authenticated user object, or `null`                               |
| `isAuthLoading` | `true` while `initAuth` is resolving on app load                   |
| `setUser(user)` | Updates the user in the store                                      |
| `clearAuth()`   | Sets `user` to `null` — called on logout or auth failure           |
| `initAuth()`    | Calls `GET /api/auth/me`; populates `user` or clears it on failure |

`AuthGate` (in `main.tsx`) calls `initAuth()` once on mount to rehydrate the session from the existing httpOnly cookie — silently, without redirecting.

Everything else (products, cart, orders, wishlist, etc.) is **server state** managed by TanStack React Query via the custom hooks in `src/hooks/`.

---

## 🌐 API Layer

`src/lib/axios.ts` exports a single Axios instance used by every API module:

| Concern       | Implementation                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Base URL      | Reads `VITE_API_URL`; falls back to `http://localhost:5000`                                             |
| Credentials   | `withCredentials: true` — httpOnly cookies sent on every request                                        |
| CSRF          | Request interceptor fetches `GET /api/auth/csrf-token` and attaches `x-csrf-token` on non-GET requests  |
| Token refresh | Response interceptor catches `401` → silently calls `POST /api/auth/refresh` → retries original request |
| Auth failure  | On repeated `401`, calls `clearAuth()` and redirects to `/login`                                        |

Each file in `src/api/` exports plain `async` functions. The hooks in `src/hooks/` wrap them with `useQuery` or `useMutation`.

---

## ✨ Key Features

### 🔐 Authentication

- Register and login with email/password or Google OAuth
- httpOnly cookie session — no tokens ever touch `localStorage`
- Email verification with a demo-mode bypass (no paid sender domain needed)
- Forgot password and reset password flows with expiring links

### 🛍️ Product Catalog

- Paginated grid with live text search, category filter, price range filter, and sort options
- Right-side filter drawer on category pages
- Product detail with description, stock indicator, reviews, and AI-powered related product rail

### 🛒 Cart and Checkout

- Persistent server-side cart synced on every mutation
- Razorpay payment flow with confirmation screen
- "Complete your order" AI recommendation rail at the bottom of the cart page

### 💝 Wishlist

- Heart-toggle from any product card or product detail page
- Move all wishlist items to cart in a single action
- Toggle public sharing — copy a shareable link or email it to anyone

### 🏪 Seller Dashboard

- Apply to become a seller from any verified account
- Create, edit, and soft-delete products with Cloudinary image upload
- Manage order statuses for your own listings

### 📊 Admin Dashboard

- Review and approve or reject pending seller applications
- Analytics dashboard: total revenue, order volume, average order value
- Top-selling products and category revenue breakdown — all rendered with Recharts

---

## 🚢 Deployment

The frontend is a standard Vite SPA and can be deployed anywhere that serves static files.

```bash
# Set the production API URL before building
VITE_API_URL=https://your-backend.railway.app npm run build

# Output is in frontend/dist/
```

For SPA routing to work, configure your host to redirect all `404`s to `index.html`. Most static hosts (Vercel, Netlify, Railway static) handle this automatically.

**Hosting recommendations:**

| Host           | SPA redirect config                     |
| -------------- | --------------------------------------- |
| Vercel         | Automatic                               |
| Netlify        | `_redirects` file: `/* /index.html 200` |
| Railway static | Automatic                               |

---

## 🤝 Contributing

1. Fork the repository and create a feature branch.
2. Make your changes. Run the linter and type checker before committing:

   ```bash
   npm run lint && npm run type-check
   ```

3. Open a pull request with a clear description of the change.

For component or design changes, include a brief description of the user-visible difference.

---

## 📄 License

[ISC](https://opensource.org/licenses/ISC) © SnapCart Contributors

---

<div align="center">

[◀ Back to Root README](../README.md) · [⚙️ Backend Docs](../backend/README.md)

</div>
