import { SellerOrdersTab } from "@/components/seller/sellerTabs/SellerOrdersTab";
import { SellerProductsTab } from "@/components/seller/sellerTabs/SellerProductsTab";
import { SellerSettingsTab } from "@/components/seller/sellerTabs/SellerSettingsTab";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

type ActiveTab = "products" | "orders" | "settings";

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground py-10 md:py-24 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Seller Dashboard
            </h1>
            <div className="flex gap-6 mt-6 border-b border-border">
              {(["products", "orders", "settings"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-2 text-sm font-medium capitalize transition-colors cursor-pointer",
                    activeTab === tab
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab === "settings" ? "Store settings" : tab}
                </button>
              ))}
            </div>
          </div>
          {activeTab === "products" && (
            <Button
              onClick={() => setIsProductModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary-hover font-medium rounded-lg flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New product
            </Button>
          )}
        </div>

        {/* Tab Panes */}
        {activeTab === "products" && (
          <SellerProductsTab
            isModalOpen={isProductModalOpen}
            setIsModalOpen={setIsProductModalOpen}
          />
        )}
        {activeTab === "orders" && <SellerOrdersTab />}
        {activeTab === "settings" && <SellerSettingsTab />}
      </div>
    </div>
  );
}
