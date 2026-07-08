import { api } from "@/lib/axios";

// GET /api/wishlist
export const getWishlistApi = () => api.get("/wishlist");

// POST /api/wishlist/add - body: { productId }
export const addToWishlistApi = (productId: string) =>
  api.post("/wishlist/add", { productId });

// DELETE /api/wishlist/remove/:productId
export const removeFromWishlistApi = (productId: string) =>
  api.delete(`/wishlist/remove/${productId}`);

// POST /api/wishlist/move-to-cart
export const moveWishlistToCartApi = () =>
  api.post("/wishlist/move-to-cart");

// PATCH /api/wishlist/share - body: { shareEnabled }
export const toggleWishlistShareApi = (shareEnabled: boolean) =>
  api.patch("/wishlist/share", { shareEnabled });

// GET /api/wishlist/share/:shareId
export const getSharedWishlistApi = (shareId: string) =>
  api.get(`/wishlist/share/${shareId}`);

// POST /api/wishlist/email - body: { email }
export const emailWishlistApi = (email: string) =>
  api.post("/wishlist/email", { email });
