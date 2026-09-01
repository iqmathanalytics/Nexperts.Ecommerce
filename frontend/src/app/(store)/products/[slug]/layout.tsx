import { API_URL, SITE_NAME } from "@/lib/utils";
import type { Metadata } from "next";
import type { ReactNode } from "react";

async function loadProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 120 } });
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await loadProduct(slug);
  if (!p) return { title: `${SITE_NAME} product` };
  return {
    title: p.seoTitle || p.name,
    description: p.seoDescription || p.description,
    openGraph: { title: p.name, description: p.description, images: p.images?.[0]?.url ? [p.images[0].url] : [] },
  };
}

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await loadProduct(slug);
  const jsonLd = p
    ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: p.name,
        description: p.description,
        sku: p.variants?.[0]?.sku,
        brand: p.brand?.name,
        image: p.images?.map((i: { url: string }) => i.url),
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: p.variants?.[0]?.price,
          availability: p.variants?.[0]?.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        aggregateRating: p.reviewCount
          ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount }
          : undefined,
      }
    : null;
  return (
    <>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      {children}
    </>
  );
}
