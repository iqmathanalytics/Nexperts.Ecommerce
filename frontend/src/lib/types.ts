export type ProductCard = {
  id: number;
  name: string;
  slug: string;
  brand: { id: number | null; name: string; slug: string | null } | null;
  imageUrl: string | null;
  hoverImageUrl?: string | null;
  variantId: number;
  sku: string;
  price: number;
  mrp: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  gender: "MEN" | "WOMEN" | "UNISEX";
};

export type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  children: CategoryNode[];
};

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  roles: string[];
  permissions?: string[];
};
