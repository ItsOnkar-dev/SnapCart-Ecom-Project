import { Spinner } from "@/components/ui/spinner";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OrderStatus {
  status: string;
  count: number;
}

interface RevenueByCategory {
  category: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  quantity: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface KPIs {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  lowStockCount: number;
}

interface AnalyticsData {
  kpis: KPIs;
  dailyRevenue: DailyRevenue[];
  topProducts: TopProduct[];
  orderStatuses: OrderStatus[];
  revenueByCategory: RevenueByCategory[];
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308", // Yellow
  confirmed: "#3b82f6", // Blue
  shipped: "#6366f1", // Indigo
  delivered: "#22c55e", // Green
  cancelled: "#ef4444", // Red
};

const CATEGORY_COLORS = [
  "#818cf8", // Indigo
  "#34d399", // Emerald
  "#fb7185", // Rose
  "#60a5fa", // Blue
  "#fbbf24", // Amber
  "#a78bfa", // Purple
  "#2dd4bf", // Teal
];

export default function AdminAnalyticsDashboard() {
  // Destructuring and asserting the Hook data structure (if not already typed in the hook)
  const { data, isLoading, error } = useAnalytics() as {
    data: AnalyticsData | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Failed to load analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Make sure you are logged in as an administrator.
        </p>
      </div>
    );
  }

  const { kpis, dailyRevenue, topProducts, orderStatuses, revenueByCategory } =
    data;

  const kpiCards = [
    {
      title: "Total Revenue",
      value: formatPrice(kpis.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      title: "Total Orders",
      value: kpis.totalOrders,
      icon: ShoppingBag,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    },
    {
      title: "Avg Order Value",
      value: formatPrice(kpis.avgOrderValue),
      icon: TrendingUp,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    },
    {
      title: "Low Stock Items",
      value: kpis.lowStockCount,
      icon: AlertTriangle,
      color:
        kpis.lowStockCount > 0
          ? "text-rose-400 bg-rose-500/10 border-rose-500/25 animate-pulse"
          : "text-neutral-400 bg-neutral-500/10 border-neutral-500/25",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-foreground space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Admin Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of platform KPIs, sales charts, and catalog alerts.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`flex items-center justify-between p-6 rounded-2xl border bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-lg ${card.color}`}
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </span>
                <p className="text-2xl font-bold tracking-tight text-white">
                  {card.value}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Sales Area Chart */}
        <div className="lg:col-span-2 border border-border bg-card/60 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-bold">14-Day Revenue & Orders</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily sales trends for the last two weeks.
            </p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyRevenue}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#262626",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="border border-border bg-card/60 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Order Statuses</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribution of all order states.
            </p>
          </div>
          <div className="h-64 w-full flex items-center justify-center relative">
            {orderStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No order data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatuses}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {orderStatuses.map((entry: OrderStatus) => (
                      <Cell
                        key={`cell-${entry.status}`}
                        fill={STATUS_COLORS[entry.status] || "#737373"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#262626",
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {orderStatuses.map((item: OrderStatus) => (
              <div key={item.status} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: STATUS_COLORS[item.status] || "#737373",
                  }}
                />
                <span className="capitalize text-muted-foreground">
                  {item.status} ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top-Selling Products */}
        <div className="border border-border bg-card/60 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Top Products</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Best selling products by units sold.
            </p>
          </div>
          <div className="h-72 w-full mt-4">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No products sold yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#262626"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#888"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#888"
                    fontSize={10}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#262626",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    name="Units Sold"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Revenue Distribution */}
        <div className="lg:col-span-2 border border-border bg-card/60 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Revenue by Category</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sales contribution segmented by department.
            </p>
          </div>
          <div className="h-72 w-full mt-4 flex flex-col md:flex-row items-center gap-6">
            {revenueByCategory.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                No sales records
              </div>
            ) : (
              <>
                <div className="h-full w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByCategory}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                      >
                        {revenueByCategory.map(
                          (item: RevenueByCategory, index: number) => (
                            <Cell
                              key={`cell-${item.category}`}
                              fill={
                                CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        formatter={(val) =>
                          typeof val === "number"
                            ? formatPrice(val)
                            : String(val ?? "")
                        }
                        contentStyle={{
                          backgroundColor: "#171717",
                          borderColor: "#262626",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Category legend grid */}
                <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {revenueByCategory.map(
                    (item: RevenueByCategory, i: number) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                            }}
                          />
                          <span className="capitalize text-muted-foreground truncate max-w-[80px]">
                            {item.category}
                          </span>
                        </div>
                        <span className="font-semibold text-white ml-2">
                          {formatPrice(item.revenue)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
