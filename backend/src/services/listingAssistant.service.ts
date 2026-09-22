import { env } from "../config/validateEnv";
import { ApiError } from "../utils/ApiResponse";

export const LISTING_CATEGORIES = [
  "electronics",
  "fashion",
  "home",
  "beauty",
  "sports",
  "books",
  "gaming",
  "new in",
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export interface GeneratedListing {
  name: string;
  description: string;
  category: ListingCategory;
  price: number;
  highlights: string[];
  shippingInfo: string;
}

function buildPrompt(input: string, category?: string): string {
  return `You are an expert product listing assistant for SnapCart, an Indian multi-vendor e-commerce marketplace.

A seller has given you a rough product idea. Your job is to generate a complete, high-converting product listing that is ready to publish.

Seller's input:
"""${input}"""
${category ? `Seller's suggested category: ${category}` : ""}

Your task:
1. Understand EXACTLY what product this is — even from vague inputs like "boat headphones", "nikes", "dell laptop i7", "face wash for oily skin", "harry potter book", "fifa 25 ps5"
2. Generate a listing perfectly suited for Indian buyers on a marketplace

Rules:
- name: Clear, descriptive product title (max 80 chars). Include brand if mentioned. No ALL CAPS. No emojis.
- description: 2-3 persuasive sentences about benefits, use case, and who it's for. Plain text, no markdown, no bullet points.
- category: MUST be exactly one of: ${LISTING_CATEGORIES.join(", ")}. Pick the most accurate one.
- price: Realistic retail price in Indian Rupees (INR) as a number only. No ₹ symbol. Base on typical Indian market price.
- highlights: Array of exactly 4-5 short bullet points (each max 60 chars). Cover key specs, material, compatibility, or benefits. Each must start with a capital letter.
- shippingInfo: One sentence about delivery time and return policy typical for this product type in India.

Return ONLY valid JSON with this exact shape — no markdown, no explanation, no backticks:
{"name":"","description":"","category":"","price":0,"highlights":["","","",""],"shippingInfo":""}`;
}

function normaliseCategory(raw: unknown): ListingCategory {
  const str = String(raw ?? "")
    .toLowerCase()
    .trim();
  if ((LISTING_CATEGORIES as readonly string[]).includes(str)) {
    return str as ListingCategory;
  }
  return "electronics";
}

function normaliseHighlights(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => String(h).trim())
    .filter(Boolean)
    .slice(0, 5);
}

function normalise(
  parsed: Record<string, unknown>,
  fallbackCategory?: string,
): GeneratedListing {
  const price = Number(parsed.price);
  return {
    name: String(parsed.name ?? "")
      .trim()
      .slice(0, 80),
    description: String(parsed.description ?? "").trim(),
    category: normaliseCategory(parsed.category ?? fallbackCategory),
    price: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
    highlights: normaliseHighlights(parsed.highlights),
    shippingInfo: String(parsed.shippingInfo ?? "").trim(),
  };
}

export async function generateProductListing(
  input: string,
  category?: string,
): Promise<{ listing: GeneratedListing; model: string }> {
  if (!env.ai.apiKey) {
    throw new ApiError(500, "AI service is not configured");
  }

  const res = await fetch(`${env.ai.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.ai.model,
      messages: [
        {
          role: "system",
          content:
            "You are a product listing expert for an Indian e-commerce marketplace. Always respond with valid JSON only. Never include markdown or explanations.",
        },
        {
          role: "user",
          content: buildPrompt(input, category),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.log("Groq error status:", res.status);
    console.log("Groq error body:", errorBody);
    // then your existing error handling below
  }

  if (res.status === 429) {
    throw new ApiError(
      429,
      "AI service is busy — please try again in a moment",
    );
  }

  if (res.status === 401) {
    throw new ApiError(500, "AI service authentication failed");
  }

  if (!res.ok) {
    throw new ApiError(502, `AI provider error: ${res.status}`);
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    model?: string;
  };

  const content = body.choices?.[0]?.message?.content ?? "{}";
  const model = body.model ?? env.ai.model;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  return { listing: normalise(parsed, category), model };
}
