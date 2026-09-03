import { cache } from "react";
import { fetchPublicApi } from "./server-api";
import type { ProductCard } from "./types";

export type StoreCommerce = {
  currency: string;
  payments: Array<{
    id: "COD" | "ONLINE";
    available: boolean;
    label: string;
    note: string;
  }>;
  shipping: {
    eta: string;
    dispatch: string;
    freeOver: number;
    flat: number;
    note: string;
  };
  returns: { days: number; note: string };
  packaging: string;
};

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  gender?: "MEN" | "WOMEN" | "UNISEX";
  description: string;
  sku?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  specifications: Record<string, string> | null;
  shippingInfo: string | null;
  returnInfo: string | null;
  brand: { name: string; slug: string } | null;
  images: Array<{ id: number; url: string; isPrimary: boolean; variantId: number | null }>;
  variants: Array<{
    id: number;
    sku: string;
    name: string;
    attributes: Record<string, string> | null;
    price: number;
    mrp: number;
    discountPercent: number;
    available: number;
    inStock: boolean;
    isDefault: boolean;
  }>;
  rating: number;
  reviewCount: number;
  reviews: Array<{
    id: number;
    rating: number;
    title: string;
    comment: string;
    firstName: string;
    createdAt: string;
    fitFeedback?: string | null;
  }>;
  related?: ProductCard[];
  categories?: Array<{ id: number; name: string; slug: string }>;
  fit?: { small: number; true: number; large: number; label: string; total: number };
  presence?: { viewers: number };
  ugc?: Array<{ id: number; imageUrl: string; caption: string | null }>;
  commerce?: StoreCommerce;
};

export const getCachedProduct = cache(async (slug: string) => {
  try {
    return await fetchPublicApi<StoreProduct>(`/products/${slug}`, 60);
  } catch {
    return null;
  }
});
