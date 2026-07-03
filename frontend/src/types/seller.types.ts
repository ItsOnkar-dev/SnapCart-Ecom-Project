// WHY THIS FILE EXISTS:
// getPendingSellers returns a specific shape — not the full User object.
// We type it exactly as the backend selects it: name, email, sellerStatus, createdAt

export type SellerStatus = "pending" | "approved" | "rejected";

// what GET /api/admin/sellers returns per applicant
export interface SellerApplicant {
  _id: string;
  name: string;
  email: string;
  sellerStatus: SellerStatus;
  createdAt: string;
}

// what PATCH /api/admin/sellers/:id returns after update
export interface SellerStatusUpdateResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  sellerStatus: SellerStatus;
}
