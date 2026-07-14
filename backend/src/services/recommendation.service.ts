import { Types } from "mongoose";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { Wishlist } from "../models/wishlist.model";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecommendedProduct {
  _id: Types.ObjectId;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
  stock: number;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  reason: string; // Always present — this is what shows under each card
  [key: string]: unknown;
}

type ScoredProduct = {
  product: any; // Mongoose doc
  score: number;
  reason: string;
};

// ─── Text Helpers ─────────────────────────────────────────────────────────────

const getTokens = (str: string): string[] =>
  str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

// Jaccard similarity — clean, well-understood, no external deps
const jaccardSimilarity = (a: string[], b: string[]): number => {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
};

// ─── Reason Generators ────────────────────────────────────────────────────────
// These produce the short human-readable label shown under each AI pick card.
// Keep them concise — they're displayed in 1 line (line-clamp-1 in the UI).

const relatedReason = (
  candidate: any,
  current: any,
  similarityScore: number,
): string => {
  if (similarityScore > 0.4) return `Similar ${current.category} product`;
  if (similarityScore > 0.2) return `Customers also viewed this`;
  if (candidate.averageRating >= 4.5)
    return `Top rated in ${candidate.category}`;
  return `More from ${candidate.category}`;
};

const boughtTogetherReason = (coCount: number): string => {
  if (coCount >= 10) return `Frequently bought together`;
  if (coCount >= 5) return `Often paired with this item`;
  return `Customers also bought this`;
};

const personalizedReason = (product: any, categoryWeight: number): string => {
  if (categoryWeight >= 6) return `Based on your cart`;
  if (categoryWeight >= 4) return `Based on your wishlist`;
  if (categoryWeight >= 2) return `Based on your orders`;
  if (product.averageRating >= 4.5) return `Top rated for you`;
  return `Recommended for you`;
};

// ─── Strategy 1: Related Products ─────────────────────────────────────────────
// Same-category + text similarity (Jaccard on name+description tokens).
// Score = 70% text similarity + 30% normalized rating.

export const getRelatedProducts = async (
  productId: string,
  limit: number = 5,
): Promise<RecommendedProduct[]> => {
  const current = await Product.findById(productId);
  if (!current) return [];

  const candidates = await Product.find({
    _id: { $ne: new Types.ObjectId(productId) },
    category: current.category,
    isActive: true,
  }).lean();

  const currentTokens = getTokens(
    `${current.name} ${current.description ?? ""}`,
  );

  const scored: ScoredProduct[] = candidates.map((prod) => {
    const candidateTokens = getTokens(`${prod.name} ${prod.description ?? ""}`);
    const textScore = jaccardSimilarity(currentTokens, candidateTokens);
    const ratingScore = (prod.averageRating ?? 0) / 5;
    const score = textScore * 0.7 + ratingScore * 0.3;

    return {
      product: prod,
      score,
      reason: relatedReason(prod, current, textScore),
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({ ...s.product, reason: s.reason }));
};

// ─── Strategy 2: Frequently Bought Together ────────────────────────────────────
// Mines order co-occurrence. Falls back to related if no order data exists.

export const getFrequentlyBoughtTogether = async (
  productId: string,
  limit: number = 4,
): Promise<RecommendedProduct[]> => {
  const pId = new Types.ObjectId(productId);

  const orders = await Order.find({
    "items.product": pId,
    status: { $ne: "cancelled" },
  }).lean();

  if (!orders.length) {
    // No co-occurrence data yet — fall back to content-based related
    return getRelatedProducts(productId, limit);
  }

  // Count weighted co-occurrences (quantity matters — 3 units = stronger signal)
  const counts: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      const itemId = item.product.toString();
      if (itemId !== productId) {
        counts[itemId] = (counts[itemId] ?? 0) + (item.quantity ?? 1);
      }
    }
  }

  const sortedPairs = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  if (!sortedPairs.length) return getRelatedProducts(productId, limit);

  const productIds = sortedPairs.map(([id]) => new Types.ObjectId(id));
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  }).lean();

  const countById = new Map(sortedPairs);
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  // Preserve co-occurrence rank order
  return productIds
    .map((id) => byId.get(id.toString()))
    .filter(Boolean)
    .map((p: any) => ({
      ...p,
      reason: boughtTogetherReason(countById.get(p._id.toString()) ?? 1),
    })) as RecommendedProduct[];
};

// ─── Strategy 3: Cart-Aware Recommendations ────────────────────────────────────
// New strategy: given a list of product IDs currently in the user's cart,
// find complementary products across categories (cross-sell, not same-category).
// This powers the "mode: cart" use case from the senior dev's hook design.

export const getCartRecommendations = async (
  productIds: string[],
  userId: string | null,
  limit: number = 4,
): Promise<RecommendedProduct[]> => {
  const pIds = productIds.map((id) => new Types.ObjectId(id));

  // Get the categories of what's already in the cart
  const cartProducts = await Product.find({
    _id: { $in: pIds },
    isActive: true,
  }).lean();
  if (!cartProducts.length) return getTopRated(limit);

  const cartCategories = new Set(cartProducts.map((p) => p.category));
  const cartCategoryList: string[] = Array.from(cartCategories);

  // Find orders that contained at least one of these products
  // to discover what people buy together with cart contents
  const orders = await Order.find({
    "items.product": { $in: pIds },
    status: { $ne: "cancelled" },
  }).lean();

  const coCount: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      const itemId = item.product.toString();
      if (!productIds.includes(itemId)) {
        coCount[itemId] = (coCount[itemId] ?? 0) + 1;
      }
    }
  }

  if (Object.keys(coCount).length >= limit) {
    // We have enough co-occurrence data — use it
    const topPairIds = Object.entries(coCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => new Types.ObjectId(id));

    const coProducts = await Product.find({
      _id: { $in: topPairIds },
      isActive: true,
    }).lean();

    const byId = new Map(coProducts.map((p) => [p._id.toString(), p]));
    return topPairIds
      .map((id) => byId.get(id.toString()))
      .filter(Boolean)
      .map((p: any) => ({
        ...p,
        reason: `Pairs well with your cart`,
      })) as RecommendedProduct[];
  }

  // Fallback: cross-category discovery — find highly-rated products
  // NOT in the same category as cart (avoids redundancy, promotes discovery)
  const crossCategoryProducts = await Product.find({
    _id: { $nin: pIds },
    category: { $nin: cartCategoryList as any[] },
    isActive: true,
  })
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(limit)
    .lean();

  if (crossCategoryProducts.length >= limit) {
    return crossCategoryProducts.map((p) => ({
      ...p,
      reason: `Complete your look`,
    })) as RecommendedProduct[];
  }

  // Final fallback: top rated excluding cart items
  return getTopRated(limit, productIds);
};

// ─── Strategy 4: Personalized (User Interest Graph) ────────────────────────────
// Builds a category affinity graph from cart (3×), wishlist (2×), orders (1×).
// Scores candidates by affinity + rating. Cold-start → top rated.

export const getPersonalizedRecommendations = async (
  userId: string,
  productIdsToExclude: string[] = [],
  limit: number = 8,
): Promise<RecommendedProduct[]> => {
  try {
    const [cart, wishlist, orders] = await Promise.all([
      Cart.findOne({ user: userId }).lean(),
      Wishlist.findOne({ user: userId }).lean(),
      Order.find({ user: userId, status: { $ne: "cancelled" } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const excludedIds = new Set<string>(productIdsToExclude);
    const categoryWeights: Record<string, number> = {};

    // Gather all product IDs we need to fetch categories for
    const cartProductIds = cart ? cart.items.map((i: any) => i.product) : [];
    const wishlistProductIds = wishlist
      ? wishlist.items.map((i: any) => i.product)
      : [];
    const orderedProductIds = orders.flatMap((o: any) =>
      o.items.map((i: any) => i.product),
    );

    // Mark as excluded
    for (const id of [
      ...cartProductIds,
      ...wishlistProductIds,
      ...orderedProductIds,
    ]) {
      excludedIds.add(id.toString());
    }

    // Fetch all interaction products in one query
    const allInteractionIds = [
      ...cartProductIds,
      ...wishlistProductIds,
      ...orderedProductIds,
    ];

    const interactionProducts =
      allInteractionIds.length > 0
        ? await Product.find({ _id: { $in: allInteractionIds } })
            .select("_id category")
            .lean()
        : [];

    const cartIdSet = new Set(cartProductIds.map((id: any) => id.toString()));
    const wishlistIdSet = new Set(
      wishlistProductIds.map((id: any) => id.toString()),
    );

    for (const p of interactionProducts) {
      const id = p._id.toString();
      // Cart items = strongest signal (3), wishlist (2), orders (1)
      if (cartIdSet.has(id)) {
        categoryWeights[p.category] = (categoryWeights[p.category] ?? 0) + 3;
      } else if (wishlistIdSet.has(id)) {
        categoryWeights[p.category] = (categoryWeights[p.category] ?? 0) + 2;
      } else {
        categoryWeights[p.category] = (categoryWeights[p.category] ?? 0) + 1;
      }
    }

    const favoriteCategories = Object.keys(categoryWeights);

    // Cold start — no interaction history
    if (!favoriteCategories.length) return getTopRated(limit);

    const candidates = await Product.find({
      category: { $in: favoriteCategories as any[] },
      _id: {
        $nin: Array.from(excludedIds).map((id) => new Types.ObjectId(id)),
      },
      isActive: true,
    }).lean();

    const scored: ScoredProduct[] = candidates.map((prod) => {
      const affinity = categoryWeights[prod.category] ?? 0;
      const ratingScore = (prod.averageRating ?? 0) / 5;
      const score = affinity * 2.0 + ratingScore * 1.5;
      return {
        product: prod,
        score,
        reason: personalizedReason(prod, affinity),
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    // Pad with top-rated if we don't have enough
    if (top.length < limit) {
      const padded = await Product.find({
        isActive: true,
        _id: {
          $nin: [
            ...top.map((s) => s.product._id),
            ...Array.from(excludedIds).map((id) => new Types.ObjectId(id)),
          ],
        },
      })
        .sort({ averageRating: -1 })
        .limit(limit - top.length)
        .lean();

      const paddedScored: ScoredProduct[] = padded.map((p) => ({
        product: p,
        score: 0,
        reason: `Top rated for you`,
      }));

      return [...top, ...paddedScored].map((s) => ({
        ...s.product,
        reason: s.reason,
      })) as RecommendedProduct[];
    }

    return top.map((s) => ({
      ...s.product,
      reason: s.reason,
    })) as RecommendedProduct[];
  } catch (error) {
    console.error("[Recommendation] Personalized strategy failed:", error);
    return getTopRated(limit);
  }
};

// ─── Utility: Top Rated Fallback ──────────────────────────────────────────────

const getTopRated = async (
  limit: number,
  excludeIds: string[] = [],
): Promise<RecommendedProduct[]> => {
  const exclude = excludeIds.map((id) => new Types.ObjectId(id));
  const products = await Product.find({
    isActive: true,
    ...(exclude.length ? { _id: { $nin: exclude } } : {}),
  })
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(limit)
    .lean();

  return products.map((p) => ({
    ...p,
    reason: `Top rated pick`,
  })) as RecommendedProduct[];
};
