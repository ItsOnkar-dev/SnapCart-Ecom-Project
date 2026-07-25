export const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  admin: [
    "view_dashboard",
    "view_orders",
    "manage_products",
    "manage_users",
    "approve_sellers",
    "delete_content",
  ],
  demo_admin: [
    "view_dashboard",
    "view_orders",
  ],
  seller: [
    "manage_own_products",
    "view_own_orders",
  ],
  customer: [
    "place_orders",
    "write_reviews",
  ],
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS][number];
