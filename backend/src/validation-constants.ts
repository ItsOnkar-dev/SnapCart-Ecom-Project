// ── Auth ──
export const NAME_MIN = 2;
export const NAME_MAX = 50;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 100;

// ── Product ──
export const PRODUCT_CATEGORIES = [
  "All Products",
  "electronics",
  "fashion",
  "home",
  "beauty",
  "sports",
  "books",
  "gaming",
  "new in",
] as const;
export const PRODUCT_NAME_MIN = 3;
export const PRODUCT_NAME_MAX = 100;
export const PRODUCT_DESC_MIN = 10;
export const PRODUCT_DESC_MAX = 2000;

// ── Review ──
export const REVIEW_TITLE_MAX = 80;
export const REVIEW_COMMENT_MIN = 10;
export const REVIEW_COMMENT_MAX = 500;
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;

// ── Order ──
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

// ── Cart ──
export const CART_ITEM_QUANTITY_MIN = 1;
