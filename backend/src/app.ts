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

const app = express();

app.use(helmet()); // Help secure Express apps by setting HTTP response headers.

app.use(morgan("dev")); // logs: POST /api/auth/login 200 45ms

// Body Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser());

// Protects against NoSQL injection by stripping $ and . from req.body
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    const sanitize = (obj: Record<string, unknown>): void => {
      for (const key of Object.keys(obj)) {
        if (key.includes("$") || key.startsWith(".")) {
          delete obj[key]; // remove dangerous keys
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitize(obj[key] as Record<string, unknown>); // recurse into nested objects
        }
      }
    };
    sanitize(req.body);
  }
  next();
});

const allowedOrigins = [
  "http://localhost:5173", // your React dev server
  process.env.FRONTEND_URL, // production frontend
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP per 15 min
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter — auth routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 login attempts per IP per 15 min
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
  console.error("Unexpected error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
