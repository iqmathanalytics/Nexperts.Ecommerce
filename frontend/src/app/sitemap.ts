import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
  ];
  try {
    const res = await fetch(`${API_URL}/products?limit=48`, { next: { revalidate: 3600 } });
    const json = await res.json();
    for (const p of json.data ?? []) {
      entries.push({ url: `${base}/products/${p.slug}`, changeFrequency: "weekly", priority: 0.7 });
    }
    const cats = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } }).then((r) => r.json());
    for (const c of cats.data ?? []) {
      entries.push({ url: `${base}/category/${c.slug}`, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {
    /* API may be offline during build */
  }
  return entries;
}
