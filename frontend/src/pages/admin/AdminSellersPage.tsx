import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSellers, useUpdateSellerStatus } from "@/hooks/useAdmin";
import type { SellerApplicant } from "@/types/seller.types";
import { Check, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminSellersPage() {
  const navigate = useNavigate();
  const { data: applicants, isLoading, isError } = useAdminSellers();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateSellerStatus();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedSeller, setSelectedSeller] = useState<SellerApplicant | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    "approved" | "rejected" | null
  >(null);

  // Navigation tab configurations to mirror Lovable preview
  const tabs = [
    { name: "Analytics", path: "/admin/analytics", count: null },
    { name: "Products", path: "/products", count: 39 }, // Dummy counts matching screenshots
    { name: "Orders", path: "/orders", count: 0 },
    {
      name: "Sellers",
      path: "/admin/sellers",
      count: applicants?.length ?? 0,
      active: true,
    },
    { name: "Coupons", path: "#", count: null },
    { name: "Returns", path: "#", count: null },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-zinc-800 selection:text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <Link
            to="/account"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 underline underline-offset-4 transition-colors"
          >
            Back to account
          </Link>
        </div>

        {/* Custom Nav Tabs (Mirrors Lovable Screenshots 137/138 layout) */}
        <div className="flex flex-wrap items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/60 backdrop-blur-md mb-8 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => tab.path !== "#" && navigate(tab.path)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                tab.active
                  ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md ${
                    tab.active
                      ? "bg-zinc-700 text-zinc-200"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Applications Workspace */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-6 bg-zinc-900/40 rounded-xl border border-zinc-800/80 space-y-3"
                >
                  <Skeleton className="h-6 w-1/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                  <Skeleton className="h-4 w-2/3 bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 bg-red-950/20 border border-red-900/40 rounded-xl text-center">
              <ShieldAlert className="h-10 w-10 text-red-500 mb-3" />
              <p className="text-sm font-medium text-red-400">
                Failed to pull pending application pools from the registry
                layer.
              </p>
            </div>
          ) : !applicants || applicants.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 text-sm">
                No seller applications require review right now.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {applicants.map((applicant: SellerApplicant) => (
                <div
                  key={applicant._id}
                  className="group relative p-6 bg-[#121214] rounded-xl border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-300 shadow-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    {/* Applicant Information Layout */}
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-zinc-100 tracking-tight group-hover:text-white transition-colors">
                          {applicant.name}
                        </h3>
                        <Badge
                          variant={
                            applicant.sellerStatus === "approved"
                              ? "default"
                              : "outline"
                          }
                          className={`capitalize text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            applicant.sellerStatus === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : applicant.sellerStatus === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {applicant.sellerStatus}
                        </Badge>
                      </div>

                      <p className="text-sm text-zinc-400 font-mono">
                        {applicant.email}{" "}
                        <span className="text-zinc-600 font-sans mx-1.5">
                          ·
                        </span>{" "}
                        {applicant.phone || "No phone provided"}
                      </p>

                      <div className="pt-2 grid gap-1 text-xs text-zinc-400">
                        <p>
                          <span className="text-zinc-500 font-medium">
                            Business ID:
                          </span>{" "}
                          {applicant.businessId || "N/A"}
                        </p>
                        <p className="leading-relaxed">
                          <span className="text-zinc-500 font-medium">
                            Address:
                          </span>{" "}
                          {applicant.address || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Action Panel: Render controls only if status is pending */}
                    {applicant.sellerStatus === "pending" && (
                      <div className="flex items-center gap-2 self-end md:self-start pt-2 md:pt-0">
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => {
                            setSelectedSeller(applicant);
                            setSelectedStatus("approved");
                            setDialogOpen(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-white gap-1.5 shadow-md shadow-emerald-950/20 rounded-lg transition-all"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => {
                            setSelectedSeller(applicant);
                            setSelectedStatus("rejected");
                            setDialogOpen(true);
                          }}
                          className="border-zinc-800 cursor-pointer text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/50 gap-1.5 rounded-lg transition-all"
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedStatus === "approved"
                ? "Approve seller application?"
                : "Reject seller application?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to <strong>{selectedStatus}</strong>{" "}
              <strong>{selectedSeller?.name}</strong>'s seller application?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              variant={
                selectedStatus === "approved" ? "default" : "destructive"
              }
              disabled={isUpdating}
              onClick={() => {
                if (!selectedSeller || !selectedStatus) return;

                updateStatus({
                  id: selectedSeller._id,
                  status: selectedStatus,
                });

                setDialogOpen(false);
                setSelectedSeller(null);
                setSelectedStatus(null);
              }}
            >
              {isUpdating
                ? selectedStatus === "approved"
                  ? "Approving..."
                  : "Rejecting..."
                : selectedStatus === "approved"
                  ? "Approve"
                  : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
