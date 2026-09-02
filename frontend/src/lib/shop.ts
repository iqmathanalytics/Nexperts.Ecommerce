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
  if (isWomenOnlyCategory(slug)) return "WOMEN";
  return null;
}

export function categoryHref(slug: string, gender?: ShopGender | null) {
  const g = gender ?? (isWomenOnlyCategory(slug) ? "WOMEN" : null);
  return g ? `/category/${slug}?gender=${g}` : `/category/${slug}`;
}

/** Attach a shop gender to category / product listing links that do not already have one. */
export function withShopGender(href: string, gender: ShopGender) {
  if (!href.startsWith("/")) return href;
  const qIndex = href.indexOf("?");
  const path = qIndex === -1 ? href : href.slice(0, qIndex);
  const params = new URLSearchParams(qIndex === -1 ? "" : href.slice(qIndex + 1));
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
