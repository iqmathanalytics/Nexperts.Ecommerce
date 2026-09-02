export type AdminNavItem = {
  label: string;
  href: string;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const adminNav: AdminNavSection[] = [
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Brands", href: "/admin/brands" },
      { label: "Collections", href: "/admin/collections" },
      { label: "Lookbooks", href: "/admin/lookbooks" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Inventory", href: "/admin/inventory" },
      { label: "Orders", href: "/admin/orders" },
    ],
  },
  {
    title: "Customers",
    items: [{ label: "Customers", href: "/admin/customers" }],
  },
  {
    title: "Marketing",
    items: [
      { label: "Coupons", href: "/admin/coupons" },
      { label: "Reviews", href: "/admin/reviews" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users", href: "/admin/users" },
      { label: "Audit log", href: "/admin/logs" },
    ],
  },
];

export function isAdminNavActive(path: string, href: string) {
  if (href === "/admin") return path === "/admin";
  if (href === "/admin/analytics") return path === "/admin/analytics" || path.startsWith("/admin/analytics/");
  if (href === "/admin/orders") return path === "/admin/orders" || path.startsWith("/admin/orders/");
  return path === href || path.startsWith(`${href}/`);
}

export function adminNavSectionForPath(path: string) {
  return adminPageMeta(path).section;
}

export function adminPageMeta(path: string): { section: string; title: string } {
  if (path === "/admin") return { section: "Overview", title: "Dashboard" };
  if (path.startsWith("/admin/analytics")) return { section: "Overview", title: "Analytics" };
  if (path === "/admin/products/create") return { section: "Catalog", title: "Create product" };
  if (/^\/admin\/products\/\d+/.test(path)) return { section: "Catalog", title: "Edit product" };
  for (const section of adminNav) {
    for (const item of section.items) {
      if (isAdminNavActive(path, item.href)) return { section: section.title, title: item.label };
    }
  }
  return { section: "System", title: "Studio" };
}
