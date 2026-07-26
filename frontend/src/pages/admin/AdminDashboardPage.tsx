import {
  useAdminOrders,
  useAdminProductsCount,
  useAdminSellers,
} from "@/hooks/useAdmin";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Extract Components
import OrdersTab from "@/components/admin/tabs/OrdersTab";
import ProductsTab from "@/components/admin/tabs/ProductsTab";
import SellersTab from "@/components/admin/tabs/SellersTab";

type ActiveTab = "analytics" | "products" | "orders" | "sellers";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>("sellers");

  // Fetch count query metrics using cached queries to hydrate navigation badges instantly
  const { data: applicants } = useAdminSellers();
  const { data: productsCount } = useAdminProductsCount();
  const { data: ordersData } = useAdminOrders(
    1,
    activeTab === "orders" || activeTab === "sellers",
  );

  const tabs: { key: ActiveTab; label: string; count: number | null }[] = [
    { key: "analytics", label: "Analytics", count: null },
    { key: "products", label: "Products", count: productsCount ?? 0 },
    {
      key: "orders",
      label: "Orders",
      count: ordersData?.pagination?.total ?? 0,
    },
    { key: "sellers", label: "Sellers", count: applicants?.length ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <Link
            to="/account"
            className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Back to account
          </Link>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/50 p-1.5 border border-border mb-8 w-fit rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "analytics") navigate("/admin/analytics");
              }}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-1.5 rounded-md cursor-pointer ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    activeTab === tab.key
                      ? "bg-muted text-foreground font-semibold"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Render Self-Contained Domain Components */}
        <main className="mt-2">
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "sellers" && <SellersTab />}
        </main>
      </div>
    </div>
  );
}
