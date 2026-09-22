export type SellerStatus = "none" | "pending" | "approved" | "rejected";
export type SellerDecisionStatus = Extract<
  SellerStatus,
  "approved" | "rejected"
>;

// what GET /api/admin/sellers returns per applicant
export interface SellerApplicant {
  _id: string;
  name: string;
  email: string;
  /** Optional fields that may be present on the user document */
  phone?: string;
  businessId?: string;
  address?: string;
  sellerStatus: SellerStatus;
  sellerApplication?: SellerApplicationInput & {
    appliedAt?: string;
  };
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

export interface SellerApplicationInput {
  storeName: string;
  contactEmail: string;
  contactPhone?: string;
  taxId?: string;
  businessAddress?: string;
  storeDescription?: string;
}

export type SellerProfileData = {
  storeName: string;
  contactEmail: string;
  contactPhone?: string;
  taxId?: string;
  businessAddress?: string;
  storeDescription?: string;
};

export interface GeneratedListing {
  name: string;
  description: string;
  category: string;
  price: number;
  highlights: string[];
  shippingInfo: string;
}

export interface ListingDraftItem {
  _id: string;
  input: string;
  listing: GeneratedListing;
  model: string;
  createdAt: string;
}
