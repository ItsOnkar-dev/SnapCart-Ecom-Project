<div align="center">

# 🛒 SnapCart

### A production-grade, full-stack multi-vendor e-commerce platform

_Built to showcase real-world engineering — not just "it works", but how it works and why._

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4)](https://tailwindcss.com/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)

<br/>

[**🚀 Live Project**](https://snapcart-now.vercel.app/) · [**📖 Backend Docs**](backend/README.md) · [**🎨 Frontend Docs**](frontend/README.md) · [**🐛 Report Bug**](https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project/issues) · [**✨ Request Feature**](https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project/issues)

</div>

---

## 📋 Table of Contents

- [🛒 SnapCart](#-snapcart)
    - [A production-grade, full-stack multi-vendor e-commerce platform](#a-production-grade-full-stack-multi-vendor-e-commerce-platform)
  - [📋 Table of Contents](#-table-of-contents)
  - [🧩 About the Project](#-about-the-project)
  - [💡 Most e-commerce portfolio projects stop at "add to cart". SnapCart goes further](#-most-e-commerce-portfolio-projects-stop-at-add-to-cart-snapcart-goes-further)
  - [🛠 Tech Stack](#-tech-stack)
  - [🏗 Architecture](#-architecture)
  - [🗺 User Journeys](#-user-journeys)
    - [Buyer](#buyer)
    - [Seller](#seller)
    - [Admin](#admin)
  - [✨ Feature Breakdown](#-feature-breakdown)
    - [🛍️ Buyer Features](#️-buyer-features)
    - [🏪 Seller Features](#-seller-features)
    - [🔐 Admin Features](#-admin-features)
    - [🔒 Security Features](#-security-features)
  - [📁 Project Structure](#-project-structure)
  - [🚀 Quick Start](#-quick-start)
    - [Prerequisites](#prerequisites)
    - [Clone and Install](#clone-and-install)
    - [Run in Development](#run-in-development)
    - [Production Build](#production-build)
  - [⚙️ Environment Variables](#️-environment-variables)
  - [📡 API at a Glance](#-api-at-a-glance)
  - [🔐 Security Highlights](#-security-highlights)
  - [🚧 Work in Progress](#-work-in-progress)
  - [✅ Recently Completed](#-recently-completed)
  - [🗓 Roadmap](#-roadmap)
  - [📚 Documentation](#-documentation)
  - [🤝 Contributing](#-contributing)
  - [🙏 Acknowledgements](#-acknowledgements)

---

## 🧩 About the Project

SnapCart is a **monorepo full-stack e-commerce platform** with a Node.js/Express REST API and a React/Vite SPA. It covers the complete lifecycle of an online marketplace — from buyer browsing and transactional checkout to seller onboarding, admin moderation, and an analytics dashboard.

This isn't a tutorial clone. Every design decision — from httpOnly cookie auth to MongoDB transactions at checkout — was made deliberately, and the reasoning is documented.

**What it demonstrates:**

| Concern              | What SnapCart does                                                    |
| -------------------- | --------------------------------------------------------------------- |
| Auth security        | JWT rotation, refresh-token reuse detection, bcrypt, httpOnly cookies |
| Data integrity       | MongoDB transactions for atomic checkout (stock + order + cart)       |
| Role architecture    | Three-tier RBAC: customer → seller → admin                            |
| Developer UX         | Demo email verification so the app works without a paid email domain  |
| Observability        | Structured audit logging for all sensitive operations                 |
| Scalability patterns | Heuristic recommendation engine without paid ML infrastructure        |

---

## 💡 Most e-commerce portfolio projects stop at "add to cart". SnapCart goes further

- **Refresh-token reuse detection** — if a stolen refresh token is replayed, the backend detects it, clears all tokens, and forces re-login. Most tutorials skip this entirely.
- **Atomic checkout** — placing an order is a single MongoDB transaction. Stock decrement, order creation, and cart clearing either all succeed or all roll back together.
- **Demo email mode** — real verification architecture (hash stored, raw token emailed, 10-minute expiry) with a fallback that returns the link in the API response. Portfolio-ready without a paid Resend domain.
- **Heuristic recommendation engine** — related, frequently-bought-together, and personalized recommendations built from order co-occurrence and user signals. No paid ML service. Fully explainable.
- **Seller workflow** — not just a product CRUD. Sellers apply, wait for admin approval, and can only manage their own products. Ownership checks are enforced at the service layer.

---

## 🛠 Tech Stack

<table>
  <tr>
    <th>Layer</th>
    <th>Technology</th>
    <th>Why</th>
  </tr>
  <tr>
    <td>Frontend</td>
    <td>React 19 · Vite · TypeScript</td>
    <td>Concurrent rendering, fast HMR, type-safe throughout</td>
  </tr>
  <tr>
    <td>Styling</td>
    <td>Tailwind CSS v4 · shadcn/ui</td>
    <td>CSS-first config, accessible Radix primitives</td>
  </tr>
  <tr>
    <td>Data Fetching</td>
    <td>TanStack React Query · Zustand</td>
    <td>Server-state caching + minimal global auth store</td>
  </tr>
  <tr>
    <td>Forms</td>
    <td>React Hook Form · Zod</td>
    <td>Schema-first validation shared with the backend</td>
  </tr>
  <tr>
    <td>Charts</td>
    <td>Recharts</td>
    <td>Composable SVG charts for the admin dashboard</td>
  </tr>
  <tr>
    <td>Backend</td>
    <td>Node.js 20 · Express 5 · TypeScript</td>
    <td>Stable LTS runtime, latest Express with native async error handling</td>
  </tr>
  <tr>
    <td>Database</td>
    <td>MongoDB Atlas · Mongoose 9</td>
    <td>Document model fits product/order/cart shapes; Atlas transactions</td>
  </tr>
  <tr>
    <td>Auth</td>
    <td>JWT · Google OAuth 2.0 · bcrypt</td>
    <td>Short-lived access tokens, rotated refresh tokens, httpOnly cookies</td>
  </tr>
  <tr>
    <td>Email</td>
    <td>Resend</td>
    <td>Modern email API with demo-mode fallback</td>
  </tr>
  <tr>
    <td>Images</td>
    <td>Cloudinary · Multer</td>
    <td>Memory storage → direct stream, no ephemeral disk dependency</td>
  </tr>
  <tr>
    <td>Payments</td>
    <td>Razorpay</td>
    <td>Full order + webhook flow with raw-body signature verification</td>
  </tr>
  <tr>
    <td>Security</td>
    <td>Helmet · CSRF · express-rate-limit · Zod</td>
    <td>Defence in depth at every layer</td>
  </tr>
  <tr>
    <td>Deployment</td>
    <td>Railway</td>
    <td>Zero-config deploys, ephemeral filesystem handled by Cloudinary</td>
  </tr>
</table>

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Monorepo Root                             │
│                                                                     │
│   ┌──────────────────────────┐      ┌───────────────────────────┐   │
│   │       frontend/          │      │         backend/          │   │
│   │                          │      │                           │   │
│   │  React 19 + Vite         │ HTTP │  Express 5 + TypeScript   │   │
│   │  Tailwind · shadcn/ui    ├─────►│  Zod · Mongoose · JWT     │   │
│   │  React Query · Zustand   │cookies  Rate limit · CSRF        │   │
│   │  Port 5173 (dev)         │      │  Port 5000                │   │
│   └──────────────────────────┘      └──────────┬────────────────┘   │
│                                                │                    │
│                              ┌─────────────────▼──────────────┐     │
│                              │         MongoDB Atlas          │     │
│                              │   Users · Products · Orders    │     │
│                              │   Cart · Reviews · Wishlists   │     │
│                              └────────────────────────────────┘     │
│                                                                     │
│   ┌────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐    │
│   │ Cloudinary │  │    Resend    │  │   Google   │  │ Razorpay │    │
│   │  (images)  │  │   (email)    │  │   OAuth    │  │(payments)│    │
│   └────────────┘  └──────────────┘  └────────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

**Request flow for a state-changing API call:**

```
Browser → CSRF token check → Rate limiter → verifyToken (JWT from cookie)
       → requireVerifiedEmail → requireRole → Zod validation → Controller
       → Service (business logic) → Mongoose → MongoDB
       → ApiResponse → Browser
```

---

## 🗺 User Journeys

### Buyer

```
Register → Verify Email → Browse Catalog → Search & Filter
    → Add to Wishlist / Cart → Razorpay Checkout
    → Track Order Status → Leave a Review
```

### Seller

```
Register → Verify Email → Apply to Become Seller
    → Admin Approves → List Products (with Cloudinary images)
    → Manage Stock → Update Order Status
```

### Admin

```
Log In → Review Seller Applications → Approve / Reject
    → Monitor Analytics Dashboard
    (Revenue · Orders · Top Products · Category Breakdown)
```

---

## ✨ Feature Breakdown

### 🛍️ Buyer Features

| Feature          | Details                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| Product Catalog  | Paginated grid with live text search, category & price filters, and sort options |
| Product Detail   | Image gallery, description, stock indicator, related product rails               |
| Cart             | Persistent server-side cart; add, update quantity, remove, clear                 |
| Checkout         | Razorpay payment flow backed by a MongoDB transaction                            |
| Order Tracking   | Status timeline: `pending → confirmed → shipped → delivered`                     |
| Order History    | Full order list with per-order detail view                                       |
| Reviews          | Write a review only after receiving a delivered order                            |
| Wishlist         | Heart-toggle from any product card; move all items to cart in one click          |
| Wishlist Sharing | Generate a public share link or email it to anyone                               |
| Recommendations  | "Related", "Frequently Bought Together", and "Personalized For You" rails        |

### 🏪 Seller Features

| Feature               | Details                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| Seller Application    | Apply from any verified account; admin is notified by email                |
| Product Management    | Create, edit, and soft-delete products with Cloudinary image upload        |
| Ownership Enforcement | Sellers can only modify their own products — enforced at the service layer |
| Order Management      | Update order status for items sold through your listings                   |

### 🔐 Admin Features

| Feature             | Details                                                           |
| ------------------- | ----------------------------------------------------------------- |
| Seller Moderation   | Review pending applications; approve or reject with one action    |
| Analytics Dashboard | Revenue, order volume, average order value, top-selling products  |
| Category Breakdown  | Revenue split by category rendered as interactive Recharts charts |
| 14-Day History      | Daily revenue and order count for the past two weeks              |

### 🔒 Security Features

| Feature                       | Details                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| JWT Auth                      | Short-lived access tokens + rotated refresh tokens in httpOnly cookies                                                      |
| Refresh-Token Reuse Detection | Replay of a used token clears all sessions and forces re-login                                                              |
| Email Verification            | HMAC-SHA256 hash stored; raw token delivered; 10-minute expiry                                                              |
| Google OAuth                  | Account linking by email prevents duplicate users                                                                           |
| CSRF Protection               | Double-submit cookie; `x-csrf-token` compared with timing-safe equality                                                     |
| Rate Limiting                 | 100 req/10 min (all routes); 20 req/10 min (login + register); 5 req/10 min (password reset); 60 req/10 min (token refresh) |
| RBAC                          | `requireRole` middleware for customer / seller / admin-gated routes                                                         |
| Audit Logging                 | Login, logout, refresh, verification, password, and seller events                                                           |

---

## 📁 Project Structure

```
snapcart/
│
├── backend/                    # Express REST API
│   ├── src/
│   │   ├── config/             # DB, Cloudinary, Google OAuth, env validation
│   │   ├── controllers/        # Route handlers (one per domain)
│   │   ├── middleware/         # Auth, CSRF, rate limit, Zod validation
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express router definitions
│   │   ├── services/           # Business logic (transactions live here)
│   │   ├── utils/              # ApiResponse, tokens, email helpers
│   │   └── types/              # TypeScript augmentations
│   ├── .env.example            # ← copy to .env and fill in values
│   └── README.md               # Full backend docs
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── api/                # Axios call functions (one per domain)
│   │   ├── components/         # UI primitives, layout, home sections
│   │   ├── hooks/              # React Query hooks (one per domain)
│   │   ├── lib/                # Axios instance (CSRF + refresh interceptors)
│   │   ├── pages/              # Route-level page components
│   │   ├── router/             # ProtectedRoute, RoleRoute guards
│   │   ├── schemas/            # Zod form schemas
│   │   ├── store/              # Zustand auth store
│   │   └── types/              # TypeScript interfaces
│   └── README.md               # Full frontend docs
│
└── README.md                   # ← you are here
```

---

## 🚀 Quick Start

### Prerequisites

| Tool    | Version                 |
| ------- | ----------------------- |
| Node.js | 20 or higher            |
| npm     | 10 or higher            |
| MongoDB | Atlas free-tier cluster |

### Clone and Install

```bash
git clone https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project.git
cd SnapCart-Ecom-Project

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Run in Development

Open two terminals:

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

### Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

---

## ⚙️ Environment Variables

Copy the backend example and fill in your values:

```bash
cp backend/.env.example backend/.env
```

**Minimum required for local development:**

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/snapcart

# JWT — use any long random strings locally
ACCESS_TOKEN_SECRET=your-super-secret-access-key-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32-chars
REFRESH_TOKEN_HASH_SECRET=your-super-secret-hash-key-min-32-chars  # optional, falls back to REFRESH_TOKEN_SECRET

# Frontend origin for CORS
FRONTEND_URL=http://localhost:5173

# Google OAuth (required by validateEnv — get from Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Cloudinary (required by validateEnv — free tier works fine)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Skip a paid Resend sender domain — returns the verification link in the API response instead
EMAIL_VERIFICATION_DEMO_MODE=true
```

**Optional services (enhanced functionality):**

```env
# Real email delivery
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com   # receives seller application alerts

# Razorpay payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

**Frontend** (create `frontend/.env`):

```env
VITE_API_URL=http://localhost:5000
```

> 💡 **`EMAIL_VERIFICATION_DEMO_MODE=true`** is the recommended setting for local and portfolio deployments. It keeps the real token-hash-expiry-clear architecture intact while skipping the need for a paid Resend sender domain.

---

## 📡 API at a Glance

All routes are prefixed with `/api`. State-changing routes require an `x-csrf-token` header — fetch the token first from `GET /api/auth/csrf-token`.

```
Auth          GET  /api/auth/csrf-token
              POST /api/auth/register
              POST /api/auth/login
              POST /api/auth/refresh
              GET  /api/auth/me
              POST /api/auth/logout
              GET  /api/auth/google
              GET  /api/auth/google/callback

Products      GET  /api/products                    (public, paginated + filters)
              GET  /api/products/recommendations    (?type=personalized|related|frequently-bought)
              GET  /api/products/:id
              POST /api/products                    (seller/admin)
              PATCH/DELETE /api/products/:id        (seller/admin, ownership-checked)

Cart          GET/POST/PATCH/DELETE /api/cart

Orders        POST /api/orders                      (atomic checkout transaction)
              GET  /api/orders
              GET  /api/orders/:id
              PATCH /api/orders/:id/status          (seller/admin)

Reviews       GET  /api/reviews/:productId
              POST /api/reviews/:productId          (verified purchasers only)
              DELETE /api/reviews/:id

Wishlist      GET  /api/wishlist
              POST /api/wishlist/add
              DELETE /api/wishlist/remove/:productId
              POST /api/wishlist/move-to-cart
              PATCH /api/wishlist/share
              GET  /api/wishlist/share/:shareId     (public)
              POST /api/wishlist/email

Seller        POST /api/seller/apply

Admin         GET  /api/admin/sellers
              PATCH /api/admin/sellers/:id
              GET  /api/admin/analytics

Payments      POST /api/payments/order
              POST /api/payments/verify
              POST /api/payments/webhook
```

For the full reference including request/response shapes, see [`backend/README.md`](backend/README.md#api-reference).

---

## 🔐 Security Highlights

```
✅ httpOnly cookies          — tokens never exposed to JavaScript
✅ Refresh-token rotation    — new token on every /refresh call
✅ Reuse detection           — replayed token clears all sessions
✅ HMAC-SHA256 token hashing — raw verification/reset tokens never stored in DB; hashed with secret key
✅ Double-submit CSRF        — timing-safe comparison on every mutation
✅ Helmet                    — secure HTTP headers out of the box
✅ Rate limiting             — 4 tiers: general (100), auth (20), password reset (5), refresh (60) per 10 min
✅ Zod validation            — schema-enforced at the route boundary
✅ RBAC                      — role middleware on every protected route
✅ Verified email guard      — checkout and seller writes require verification
✅ Upload safety             — MIME check + size limit + memory-only storage
✅ Audit logging             — every sensitive event is recorded
```

---

## 🚧 Work in Progress

Some features are **partially built or actively being developed** — they exist in the codebase but are not fully complete yet:

- **Admin Panel:** The dashboard UI is visible, but the update/delete actions are currently mock functions.
- **User Profiles:** Users can sign up, but the ability to edit profile details is still under construction.

> This is a portfolio project under active development. Some pages or flows may be incomplete or show placeholder UI.
> If you encounter any unexpected bugs or have feedback while exploring the application, feel free to open an issue.

---

## ✅ Recently Completed

These features were planned and are now fully implemented:

- [] **Razorpay payment integration** — full order creation, webhook, signature verification
- [] **CI/CD pipeline** — GitHub Actions running type-check, lint and build on every push
- [] **Multi-image upload** — product gallery with multiple Cloudinary images per listing
- [] **Dark mode** — system-aware theme toggle persisted across sessions
- [] **AI recommendations** — related, frequently-bought-together, and personalized rails
- [] **Pagination** — URL-based pagination with filters preserved across pages
- [x] **Review pagination** — public product reviews now paginated (20 per page) with frontend navigation
- [x] **Analytics caching** — admin analytics cached in-memory with 5-minute TTL, auto-invalidated on order changes

> 💡 **Note on Payments:** The payment gateway is currently running in **Razorpay Test Mode**. You can safely test the entire checkout flow using dummy card details(4242) or simulated payment methods without spending real money.

---

## 🗓 Roadmap

These are **planned upcoming features** — not yet started, but on the list:

- [ ] **Monolith to microservices migration** — decomposing the monolithic backend into decoupled, domain-specific services (e.g., Auth, Inventory, Ordering) to improve scalability and fault isolation
- [ ] **API Gateway implementation** — deploying a central API Gateway (such as Kong, Apache APISIX, or KrakenD) to act as the single entry point for routing, authentication, rate limiting, and load balancing across services
- [ ] **Automated test suite** — unit tests for services, integration tests for auth and checkout flows
- [ ] **Real-time order notifications** — WebSocket or SSE so buyers see status changes instantly without refreshing
- [ ] **Advanced search** — full-text search powered by MongoDB Atlas Search or Elasticsearch
- [ ] **Coupon / discount system** — promo codes with expiry dates, usage limits, and per-category rules

Have an idea or want to help build one of these? [Open a feature request →](https://github.com/ItsOnkar-dev/SnapCart-Ecom-Project/issues)

---

## 📚 Documentation

| Document                                   | What's inside                                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [`backend/README.md`](backend/README.md)   | Complete API reference · Auth flow · Security measures · Architecture decisions · Deployment checklist      |
| [`frontend/README.md`](frontend/README.md) | Component tree · Full route table · State management · API layer (CSRF + refresh interceptors) · Deployment |

---

## 🤝 Contributing

Contributions of all kinds are welcome — bug fixes, features, docs improvements, or refactors.

1. **Fork** the repository and create a branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes.** Follow the existing code style — ESLint configs are included for both packages.
3. **Check your work** before pushing:

   ```bash
   cd backend  && npm run lint && npm run type-check
   cd frontend && npm run lint && npm run type-check
   ```

4. **Open a pull request** with a clear title and description of what you changed and why.

For significant changes (new routes, schema changes, auth flow modifications), please open an issue first to discuss the approach before writing code.

> **Code of Conduct:** Be respectful, constructive, and inclusive. Harassment or abusive behaviour of any kind will not be tolerated.

---

## 🙏 Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) — beautifully composed Radix UI components
- [TanStack Query](https://tanstack.com/query) — the gold standard for server-state management in React
- [Resend](https://resend.com/) — developer-first transactional email
- [Cloudinary](https://cloudinary.com/) — effortless image storage and transformation
- [Razorpay](https://razorpay.com/) — payment gateway with a great developer experience
- [Railway](https://railway.app/) — zero-friction backend deployment
- [MongoDB Atlas](https://www.mongodb.com/atlas) — fully managed cloud database with free tier

---

<div align="center">

Made with ❤️ by [Onkar](https://github.com/ItsOnkar-dev)

⭐ **Star this repo** if you found it useful or learned something from it!

</div>
