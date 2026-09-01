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
    ],
  },
  {
    title: "Inventory",
    items: [{ label: "Inventory", href: "/admin/inventory" }],
  },
  {
    title: "Orders",
    items: [{ label: "Orders", href: "/admin/orders" }],
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
    title: "Administration",
    items: [{ label: "Users", href: "/admin/users" }],
  },
  {
    title: "Logs",
    items: [{ label: "Logs", href: "/admin/logs" }],
  },
];

export function isAdminNavActive(path: string, href: string) {
  if (href === "/admin") return path === "/admin";
  if (href === "/admin/analytics") return path === "/admin/analytics" || path.startsWith("/admin/analytics/");
  if (href === "/admin/orders") return path === "/admin/orders" || path.startsWith("/admin/orders/");
  return path === href || path.startsWith(`${href}/`);
}

export function adminNavSectionForPath(path: string) {
  for (const section of adminNav) {
    if (section.items.some((item) => isAdminNavActive(path, item.href))) return section.title;
  }
  return null;
}
