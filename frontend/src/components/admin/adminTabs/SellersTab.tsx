// Manages applicant cards and the approve/reject decision modals.

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

export default function SellersTab() {
  const {
    data: applicants,
    isLoading: sellersLoading,
    isError: sellersError,
  } = useAdminSellers();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateSellerStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerApplicant | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<
    "approved" | "rejected" | null
  >(null);

  if (sellersLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 bg-card border border-border space-y-3 rounded-xl"
          >
            <Skeleton className="h-6 w-1/4 bg-muted" />
            <Skeleton className="h-4 w-1/2 bg-muted" />
            <Skeleton className="h-4 w-2/3 bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (sellersError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-950/20 border border-red-900/40 text-center rounded-xl">
        <ShieldAlert className="h-10 w-10 text-red-500 mb-3" />
        <p className="text-sm font-medium text-red-400">
          Failed to load seller applications.
        </p>
      </div>
    );
  }

  if (!applicants || applicants.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-xl">
        <p className="text-muted-foreground text-sm">
          No seller applications require review right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {applicants.map((applicant: SellerApplicant) => (
          <div
            key={applicant._id}
            className="group relative p-6 bg-card border border-border hover:border-border/80 transition-all duration-300 rounded-xl"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-foreground tracking-tight">
                    {applicant.name}
                  </h3>
                  <Badge
                    variant={
                      applicant.sellerStatus === "approved"
                        ? "default"
                        : "outline"
                    }
                    className={`capitalize text-xs px-2.5 py-0.5 font-medium ${
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
                <p className="text-sm text-muted-foreground font-mono">
                  {applicant.email}{" "}
                  <span className="text-muted-foreground/50 font-sans mx-1.5">
                    ·
                  </span>{" "}
                  {applicant.phone || "No phone provided"}
                </p>
                <div className="pt-2 grid gap-1 text-xs text-muted-foreground">
                  <p>
                    <span className="text-muted-foreground font-medium">
                      Business ID:
                    </span>{" "}
                    {applicant.businessId || "N/A"}
                  </p>
                  <p className="leading-relaxed">
                    <span className="text-muted-foreground font-medium">
                      Address:
                    </span>{" "}
                    {applicant.address || "N/A"}
                  </p>
                </div>
              </div>
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
                    className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-white gap-1.5 shadow-md shadow-emerald-950/20 transition-all"
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
                    className="border-border cursor-pointer text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 gap-1.5 transition-all"
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
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
