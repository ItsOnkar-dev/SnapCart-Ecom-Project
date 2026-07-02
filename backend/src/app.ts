import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/product.routes";
import reviewRoutes from "./routes/review.routes";
import sellerRoutes from "./routes/seller.routes";
import { ApiError } from "./utils/ApiResponse";
import { Logger } from "./utils/logger";

const app = express();

app.set("trust proxy", 1); // Trust the first proxy in front of Express, which is important for rate limiting and CORS when behind a reverse proxy or load balancer.

app.use(helmet()); // Help secure Express apps by setting HTTP response headers.

app.use(morgan("dev")); // logs: POST /api/auth/login 200 45ms

// Body Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser());

// NoSQL Injection Sanitization ────────────────────────────────────────────
// Strips MongoDB operators ($ and .) from req.body, req.query AND req.params
// to prevent NoSQL injection via any part of the request
const sanitize = (obj: Record<string, unknown>): void => {
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.startsWith(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitize(obj[key] as Record<string, unknown>);
    }
  }
};
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") sanitize(req.body);
  if (req.query && typeof req.query === "object")
    sanitize(req.query as Record<string, unknown>);
  if (req.params && typeof req.params === "object") sanitize(req.params);
  next();
});

const allowedOrigins = [
  "http://localhost:5173", 
  process.env.FRONTEND_URL, 
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allows cookies to be sent cross-origin
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // max 10 login attempts per IP per 10 min
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

// Global error handler —
// Express knows this is an error handler because it has 4 parameters (err, req, res, next)
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  // If it's our own ApiError, we have statusCode + message ready
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // If it's some unexpected error (DB crash, bug, etc.)
  Logger.error("Unexpected error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
