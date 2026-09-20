import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/validateEnv";
import { csrfProtection } from "./middleware/csrf.middleware";
import { mongoSanitize } from "./middleware/sanitize";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import cartRoutes from "./routes/cart.routes";
import couponRoutes from "./routes/coupon.routes";
import healthRoutes from "./routes/health.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import productRoutes from "./routes/product.routes";
import reviewRoutes from "./routes/review.routes";
import sellerRoutes from "./routes/seller.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import { ApiError } from "./utils/ApiResponse";
import { Logger } from "./utils/logger";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many webhook requests",
});

app.use(
  "/api/payments/webhook",
  webhookLimiter,
  express.raw({ type: "application/json" }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(mongoSanitize);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  env.frontendUrl,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  }),
);

app.use("/api/v1", healthRoutes);

const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
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

app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.path === "/payments/webhook") return next();
  if (
    req.path === "/auth/login" ||
    req.path === "/auth/register" ||
    req.path === "/auth/forgot-password" ||
    req.path === "/auth/reset-password"
  )
    return next();
  return csrfProtection(req, res, next);
});

app.use("/api/auth", authRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  Logger.error("Unexpected error:", err instanceof Error ? err.stack : err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
