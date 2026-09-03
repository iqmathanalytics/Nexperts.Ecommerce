import { ProductPageClient } from "./ProductPageClient";
import { getCachedProduct } from "@/lib/productFetch";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCachedProduct(slug);
  return <ProductPageClient slug={slug} initial={product} />;
}
