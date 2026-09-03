export type ShopGender = "WOMEN" | "MEN";

export const WOMEN_ONLY_CATEGORY_SLUGS = new Set([
  "dresses",
  "casual-dresses",
  "evening-dresses",
  "party-dresses",
  "maxi-dresses",
  "midi-dresses",
  "mini-dresses",
  "ethnic-wear",
  "ethnic-dresses",
]);

export const SHARED_CATEGORY_SLUGS = new Set(["tops", "bottoms", "outerwear"]);

/** Homepage / footer Woman chips — slugs that exist in the catalog. */
export const WOMEN_CATEGORY_NAV = [
  { slug: "dresses", label: "Dresses" },
  { slug: "tops", label: "Tops" },
  { slug: "bottoms", label: "Bottoms" },
  { slug: "ethnic-wear", label: "Ethnic Wear" },
  { slug: "outerwear", label: "Outerwear" },
] as const;

/** Men hub + category pages — replace generic Tops/Bottoms with garment types. */
export const MEN_CATEGORY_NAV = [
  { slug: "shirts", label: "Shirts" },
  { slug: "t-shirts", label: "T-shirt" },
  { slug: "trousers", label: "Trousers" },
  { slug: "jackets", label: "Jackets" },
] as const;

/** Names and leftover department slugs → catalog slugs. */
const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "ethnic wear": "ethnic-wear",
  ethnicwear: "ethnic-wear",
  "ethnic-wear": "ethnic-wear",
  heritage: "ethnic-wear",
  dress: "dresses",
  top: "tops",
  bottom: "bottoms",
  shirt: "shirts",
  tshirt: "t-shirts",
  "t shirt": "t-shirts",
  "t-shirt": "t-shirts",
  tees: "t-shirts",
  tee: "t-shirts",
  trouser: "trousers",
  pants: "trousers",
  jacket: "jackets",
};

const MEN_DEPARTMENT_SLUG: Record<string, string> = {
  tops: "shirts",
  bottoms: "trousers",
  outerwear: "jackets",
  pants: "trousers",
  trouser: "trousers",
  shirt: "shirts",
  jacket: "jackets",
  coat: "jackets",
  coats: "jackets",
};

const MEN_TITLE_BY_SLUG: Record<string, string> = {
  shirts: "Shirts",
  "t-shirts": "T-shirt",
  trousers: "Trousers",
  jackets: "Jackets",
  tops: "Shirt",
  bottoms: "Trousers",
  outerwear: "Jackets",
};

export const MEN_PARENT_SLUGS = new Set(["tops", "bottoms", "outerwear"]);

export function menCategoryTitle(slug: string) {
  return MEN_TITLE_BY_SLUG[slug] ?? "";
}

export function categoryDisplayName(slug: string, name: string, gender?: ShopGender | null) {
  if (gender === "MEN") {
    const titled = menCategoryTitle(slug);
    if (titled) return titled;
  }
  return name;
}

export function isWomenOnlyCategory(slug: string) {
  return WOMEN_ONLY_CATEGORY_SLUGS.has(slug) || slug.includes("dress");
}

export function parseShopGender(value: string | null | undefined): ShopGender | null {
  if (value === "WOMEN" || value === "MEN") return value;
  return null;
}

export function inferCategoryGender(slug: string, param?: string | null): ShopGender | null {
  const fromParam = parseShopGender(param);
  if (fromParam) return fromParam;
  if (isWomenOnlyCategory(normalizeCategorySlug(slug))) return "WOMEN";
  return null;
}

export function normalizeCategorySlug(raw: string) {
  let value = raw;
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep raw */
  }
  value = value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  const spaced = value.replace(/-/g, " ");
  const compact = value.replace(/-/g, "");
  return CATEGORY_SLUG_ALIASES[value] ?? CATEGORY_SLUG_ALIASES[spaced] ?? CATEGORY_SLUG_ALIASES[compact] ?? value;
}

/** Map labels like “Bottoms” (Man) onto shirts / trousers / jackets. */
export function resolveCategorySlug(raw: string, gender?: ShopGender | null) {
  const slug = normalizeCategorySlug(raw);
  if (gender === "MEN") return MEN_DEPARTMENT_SLUG[slug] ?? slug;
  return slug;
}

export function categoryHref(slug: string, gender?: ShopGender | null) {
  const resolved = resolveCategorySlug(slug, gender);
  const g = gender ?? (isWomenOnlyCategory(resolved) ? "WOMEN" : null);
  return g ? `/category/${resolved}?gender=${g}` : `/category/${resolved}`;
}

/** Attach a shop gender to category / product listing links that do not already have one. */
export function withShopGender(href: string, gender: ShopGender) {
  if (!href.startsWith("/")) return href;
  const qIndex = href.indexOf("?");
  let path = qIndex === -1 ? href : href.slice(0, qIndex);
  const params = new URLSearchParams(qIndex === -1 ? "" : href.slice(qIndex + 1));
  if (path.startsWith("/category/")) {
    path = `/category/${resolveCategorySlug(path.slice("/category/".length), gender)}`;
  }
  if (
    path.startsWith("/category/") ||
    path === "/products" ||
    path === "/sale" ||
    path.startsWith("/collections/")
  ) {
    if (!params.get("gender")) params.set("gender", gender);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function shopGenderLabel(gender: ShopGender) {
  return gender === "MEN" ? "Man" : "Woman";
}
