import { Types } from "mongoose";
import { Product } from "../models/product.model";
import { Cart } from "../models/cart.model";
import { Wishlist } from "../models/wishlist.model";
import { Order } from "../models/order.model";

// Helper to tokenize and clean string for simple text similarity
const getTokens = (str: string): string[] => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);
};

// Jaccard similarity between two token sets
const computeSimilarity = (tokens1: string[], tokens2: string[]): number => {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }
  const union = set1.size + set2.size - intersection;
  return intersection / union;
};

// 1. Contextual Related Products (Category matching + Name/Description Similarity)
export const getRelatedProducts = async (productId: string, limit: number = 5) => {
  const currentProduct = await Product.findById(productId);
  if (!currentProduct) return [];

  // Find other active products in same category
  const candidates = await Product.find({
    _id: { $ne: new Types.ObjectId(productId) },
    category: currentProduct.category,
    isActive: true,
  });

  const currentTokens = getTokens(`${currentProduct.name} ${currentProduct.description}`);

  const scored = candidates.map((prod) => {
    const candidateTokens = getTokens(`${prod.name} ${prod.description}`);
    const textScore = computeSimilarity(currentTokens, candidateTokens);
    // Score combines text similarity (70%) and average rating (30%)
    const ratingScore = prod.averageRating / 5;
    const finalScore = textScore * 0.7 + ratingScore * 0.3;

    return { product: prod, score: finalScore };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
};

// 2. Frequently Bought Together (Order co-occurrence)
export const getFrequentlyBoughtTogether = async (productId: string, limit: number = 4) => {
  const pId = new Types.ObjectId(productId);

  // Find orders containing this product
  const orders = await Order.find({
    "items.product": pId,
    status: { $ne: "cancelled" },
  });

  if (orders.length === 0) {
    // Fallback: get related products
    return getRelatedProducts(productId, limit);
  }

  // Count occurrences of other products
  const counts: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      const itemProdId = item.product.toString();
      if (itemProdId !== productId) {
        counts[itemProdId] = (counts[itemProdId] || 0) + item.quantity;
      }
    }
  }

  const sortedPairs = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sortedPairs.length === 0) {
    return getRelatedProducts(productId, limit);
  }

  const productIds = sortedPairs.map(([id]) => new Types.ObjectId(id));
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  // Maintain co-occurrence order
  return productIds
    .map((id) => products.find((p) => p._id.toString() === id.toString()))
    .filter(Boolean) as any[];
};

// 3. Personalized Recommendations (Based on user interaction categories)
export const getPersonalizedRecommendations = async (userId: string, limit: number = 8) => {
  // Fetch user interaction data in parallel
  const [cart, wishlist, orders] = await Promise.all([
    Cart.findOne({ user: userId }),
    Wishlist.findOne({ user: userId }),
    Order.find({ user: userId, status: { $ne: "cancelled" } }).limit(10),
  ]);

  const excludedProductIds = new Set<string>();
  const categoryInteractions: Record<string, number> = {};

  // Track items to exclude (already in cart/wishlist) and category frequencies
  if (cart) {
    for (const item of cart.items) {
      excludedProductIds.add(item.product.toString());
    }
  }

  if (wishlist) {
    for (const item of wishlist.items) {
      excludedProductIds.add(item.product.toString());
    }
  }

  // Load products in cart & wishlist to count their categories
  const cartProductIds = cart ? cart.items.map((i) => i.product) : [];
  const wishlistProductIds = wishlist ? wishlist.items.map((i) => i.product) : [];

  const [cartProducts, wishlistProducts] = await Promise.all([
    Product.find({ _id: { $in: cartProductIds } }),
    Product.find({ _id: { $in: wishlistProductIds } }),
  ]);

  for (const p of cartProducts) {
    categoryInteractions[p.category] = (categoryInteractions[p.category] || 0) + 3; // Weight cart items higher
  }

  for (const p of wishlistProducts) {
    categoryInteractions[p.category] = (categoryInteractions[p.category] || 0) + 2; // Weight wishlist items medium
  }

  for (const order of orders) {
    for (const item of order.items) {
      excludedProductIds.add(item.product.toString());
      // We don't have categories on order items directly, so we can try to look it up or fetch if needed
    }
  }

  // Fetch ordered products to determine categories
  const orderedProductIds = orders.flatMap((o) => o.items.map((i) => i.product));
  if (orderedProductIds.length > 0) {
    const orderedProducts = await Product.find({ _id: { $in: orderedProductIds } });
    for (const p of orderedProducts) {
      categoryInteractions[p.category] = (categoryInteractions[p.category] || 0) + 1; // Weight order items
    }
  }

  // If no user interactions yet (cold start), return trending products
  const favoriteCategories = Object.entries(categoryInteractions)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  if (favoriteCategories.length === 0) {
    // Return top rated products
    return Product.find({ isActive: true })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit);
  }

  // Query candidate products in user's favorite categories
  const candidates = await Product.find({
    category: { $in: favoriteCategories },
    _id: { $nin: Array.from(excludedProductIds).map((id) => new Types.ObjectId(id)) },
    isActive: true,
  });

  // Score candidate products
  const scored = candidates.map((prod) => {
    // Category affinity (number of interactions)
    const affinity = categoryInteractions[prod.category] || 0;
    // Rating score (0 to 1)
    const ratingScore = prod.averageRating / 5;
    // Final score combines affinity and rating
    const finalScore = affinity * 2.0 + ratingScore * 1.5;

    return { product: prod, score: finalScore };
  });

  scored.sort((a, b) => b.score - a.score);

  const recs = scored.slice(0, limit).map((s) => s.product);

  // If we don't have enough recommendations, pad with general top rated items
  if (recs.length < limit) {
    const paddingLimit = limit - recs.length;
    const padding = await Product.find({
      isActive: true,
      _id: {
        $nin: [
          ...recs.map((r) => r._id),
          ...Array.from(excludedProductIds).map((id) => new Types.ObjectId(id)),
        ],
      },
    })
      .sort({ averageRating: -1 })
      .limit(paddingLimit);

    return [...recs, ...padding];
  }

  return recs;
};
