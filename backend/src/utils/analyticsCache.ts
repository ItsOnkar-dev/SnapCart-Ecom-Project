import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { Logger } from "./logger";

// ── In-memory cache ────────────────────────────────────────────────────────────

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateAnalyticsCache = (): void => {
  cache = null;
};

// ── Analytics computation ──────────────────────────────────────────────────────

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    lowStockCount: number;
  };
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ _id: string; name: string; quantity: number }>;
  orderStatuses: Array<{ status: string; count: number }>;
  revenueByCategory: Array<{ category: string; revenue: number }>;
}

const computeAnalytics = async (): Promise<AnalyticsData> => {
  // 1. Order status distribution — across ALL orders (including cancelled)
  const orderStatusAgg = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const orderStatuses = orderStatusAgg.map((item) => ({
    status: item._id,
    count: item.count,
  }));

  // 2. Everything else — filtered to non-cancelled orders, combined via $facet
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const totalOrders = await Order.countDocuments();

  const [analyticsResult] = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    {
      $facet: {
        kpis: [
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalPrice" },
              avgOrderValue: { $avg: "$totalPrice" },
            },
          },
        ],
        dailyRevenue: [
          { $match: { createdAt: { $gte: fourteenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$totalPrice" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        topProducts: [
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.product",
              name: { $first: "$items.name" },
              quantity: { $sum: "$items.quantity" },
            },
          },
          { $sort: { quantity: -1 } },
          { $limit: 5 },
        ],
        revenueByCategory: [
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.product",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          { $unwind: "$productDetails" },
          {
            $group: {
              _id: "$productDetails.category",
              revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            },
          },
          { $sort: { revenue: -1 } },
        ],
      },
    },
  ]);

  const totalRevenue = analyticsResult?.kpis?.[0]?.totalRevenue ?? 0;
  const avgOrderValue = analyticsResult?.kpis?.[0]?.avgOrderValue ?? 0;

  const dailyRevenueAgg = analyticsResult?.dailyRevenue ?? [];
  const dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split("T")[0];
    const match = dailyRevenueAgg.find((r: { _id: string }) => r._id === dateStr);
    dailyRevenue.push({
      date: dateStr,
      revenue: match ? match.revenue : 0,
      orders: match ? match.orders : 0,
    });
  }

  const topProducts = analyticsResult?.topProducts ?? [];
  const revenueByCategory = (analyticsResult?.revenueByCategory ?? []).map(
    (c: { _id: string; revenue: number }) => ({
      category: c._id,
      revenue: c.revenue,
    }),
  );

  const lowStockCount = await Product.countDocuments({
    isActive: true,
    stock: { $lt: 10 },
  });

  return {
    kpis: { totalRevenue, totalOrders, avgOrderValue, lowStockCount },
    dailyRevenue,
    topProducts,
    orderStatuses,
    revenueByCategory,
  };
};

// ── Public accessor ────────────────────────────────────────────────────────────

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data as AnalyticsData;
  }

  Logger.info("Analytics cache miss — recomputing");
  const data = await computeAnalytics();
  cache = { data, timestamp: Date.now() };
  return data;
};
