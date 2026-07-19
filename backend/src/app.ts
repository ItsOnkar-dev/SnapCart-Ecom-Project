import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { csrfProtection } from "./middleware/csrf.middleware";
import { mongoSanitize } from "./middleware/sanitize";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import productRoutes from "./routes/product.routes";
import reviewRoutes from "./routes/review.routes";
import sellerRoutes from "./routes/seller.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import { ApiError } from "./utils/ApiResponse";
import { Logger } from "./utils/logger";

const app = express();

app.set("trust proxy", 1); // Trust the first proxy in front of Express, which is important for rate limiting and CORS when behind a reverse proxy or load balancer.

app.use(helmet()); // Help secure Express apps by setting HTTP response headers.

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

//  Raw body parser for Razorpay webhook. This middleware ONLY applies to /api/payments/webhook. Razorpay computes its webhook signature on the raw request body. If express.json() runs first, req.body becomes a parsed JS object and
// JSON.stringify() on it may produce a different string (key order, whitespace),
// breaking signature verification. Raw Buffer is the only safe option.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Body Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser());

// Then sanitize — now req.body is populated and CORS headers are already sent
app.use(mongoSanitize);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Passing null, false rejects the origin cleanly without throwing a 500 error
        callback(null, false);
      }
    },
    credentials: true, // allows cookies to be sent cross-origin
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  }),
);

// General limiter — all routes
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // max 100 requests per IP per 10 min
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter — auth routes only
// NOTE: Route-level limiters in auth.routes.ts are the authoritative source.
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // max 20 login attempts per IP per 10 min
  message: {
    success: false,
    message: "Too many auth requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── CSRF — skip webhook ───────────────────────────────────────────────────────
// Webhook is server-to-server from Razorpay — no CSRF token possible.
// Security is handled by HMAC-SHA256 signature inside handleWebhook.
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.path === "/payments/webhook") return next(); // skip CSRF for webhook
  return csrfProtection(req, res, next);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);

// Global error handler —
// Express knows this is an error handler because it has 4 parameters (err, req, res, next)
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  // If it's our own ApiError, we have statusCode + message ready
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // If it's some unexpected error (DB crash, bug, etc.)
  Logger.error("Unexpected error:", err instanceof Error ? err.stack : err); // Changed this line
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
