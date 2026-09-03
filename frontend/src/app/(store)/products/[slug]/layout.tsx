import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/utils";
import { getCachedProduct } from "@/lib/productFetch";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getCachedProduct(slug);
  if (!p) return { title: `${SITE_NAME} product` };
  return {
    title: p.seoTitle || p.name,
    description: p.seoDescription || p.description,
    openGraph: { title: p.name, description: p.description, images: p.images?.[0]?.url ? [p.images[0].url] : [] },
  };
}

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getCachedProduct(slug);
  const jsonLd = p
    ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: p.name,
        description: p.description,
        sku: p.variants?.[0]?.sku,
        brand: p.brand?.name,
        image: p.images?.map((i) => i.url),
        offers: {
          "@type": "Offer",
          priceCurrency: "MYR",
          price: p.variants?.[0]?.price,
          availability: p.variants?.[0]?.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        aggregateRating: p.reviewCount
          ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount }
          : undefined,
      }
    : null;
  const jsonLdHtml = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
    : "";
  return (
    <>
      {jsonLdHtml ? <div dangerouslySetInnerHTML={{ __html: jsonLdHtml }} /> : null}
      {children}
    </>
  );
}
