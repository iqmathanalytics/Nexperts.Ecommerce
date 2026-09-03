"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { PageState, Skeleton } from "@/components/ui/state";
import { PageBackCorner } from "@/components/store/BackButton";

export default function LookbookPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["lookbook", slug],
    queryFn: () =>
      api<{
        title: string;
        description: string | null;
        coverImageUrl: string | null;
        videoUrl: string | null;
        items: Array<{
          productId: number;
          name: string;
          slug: string;
          imageUrl: string | null;
          price: number;
          hotspotX?: number | null;
          hotspotY?: number | null;
        }>;
      }>(`/lookbooks/${slug}`).catch(async () => {
        // Fallback via designer collection search is handled by API; if missing, try seasonal
        throw new Error("not found");
      }),
  });

  if (isLoading) return <Skeleton className="h-[70vh] w-full" />;
  if (isError || !data?.data) return <PageState title="Lookbook not found" />;

  const lb = data.data;

  return (
    <div>
      <section className="relative min-h-[70vh] bg-ink text-white">
        {lb.videoUrl ? (
          <video src={lb.videoUrl} className="absolute inset-0 h-full w-full object-cover opacity-80" autoPlay muted loop playsInline />
        ) : lb.coverImageUrl ? (
          <Image src={lb.coverImageUrl} alt="" fill priority className="object-cover object-center opacity-90" sizes="100vw" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <PageBackCorner fallback="/products" tone="light" />
        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 py-16 md:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">Lookbook</p>
          <h1 className="mt-3 font-display text-5xl font-semibold md:text-6xl">{lb.title}</h1>
          {lb.description ? <p className="mt-4 max-w-xl text-sm text-white/75">{lb.description}</p> : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <h2 className="font-display text-3xl font-semibold">Shop the look</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(lb.items ?? []).map((item) => (
            <Link key={item.productId} href={`/products/${item.slug}`} prefetch className="group border border-line bg-surface">
              <div className="relative aspect-[2/3] overflow-hidden bg-surface-muted">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill className="object-cover object-center" sizes="33vw" />
                ) : null}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-muted">{formatINR(item.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
