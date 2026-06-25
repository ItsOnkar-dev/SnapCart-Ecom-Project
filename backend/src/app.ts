import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/product.routes";
import reviewRoutes from "./routes/review.routes";
import sellerRoutes from "./routes/seller.routes";
import { ApiError } from "./utils/ApiResponse";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser());

// Mount routes
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
  console.error("Global error handler caught:", err);
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
