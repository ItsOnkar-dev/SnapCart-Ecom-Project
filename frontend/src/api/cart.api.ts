// WHY: cart routes have slightly different URL patterns than you'd expect.

import { api } from "../lib/axios";

// GET /api/cart
export const getCartApi = () => api.get("/cart");

// POST /api/cart/add — body: { productId, quantity }
export const addToCartApi = (productId: string, quantity: number) =>
  api.post("/cart/add", { productId, quantity });

// PATCH /api/cart/:productId — body: { quantity }
export const updateCartItemApi = (productId: string, quantity: number) =>
  api.patch(`/cart/${productId}`, { quantity });

// DELETE /api/cart/:productId — removes one specific item
export const removeCartItemApi = (productId: string) =>
  api.delete(`/cart/${productId}`);

// DELETE /api/cart — wipes entire cart
// called after order is successfully placed
export const clearCartApi = () => api.delete("/cart");
