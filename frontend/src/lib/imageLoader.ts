export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const q = Math.min(quality ?? 70, 80);
  const w = Math.min(Math.max(1, width), 1400);
  const h = Math.round((w * 4) / 3);

  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("crop", "top");
    url.searchParams.set("w", String(w));
    url.searchParams.set("h", String(h));
    url.searchParams.set("q", String(q));
    url.searchParams.set("fm", "webp");
    return url.toString();
  }

  if (src.startsWith("https://images.pexels.com/")) {
    const url = new URL(src);
    url.searchParams.set("auto", "compress");
    url.searchParams.set("cs", "tinysrgb");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(w));
    url.searchParams.set("h", String(h));
    url.searchParams.set("q", String(q));
    return url.toString();
  }

  // Local /public assets — append width so the custom Next loader contract is satisfied.
  if (src.startsWith("/")) {
    const join = src.includes("?") ? "&" : "?";
    return `${src}${join}w=${w}`;
  }

  return src;
}

/** Portrait crop that keeps the full clothed figure in 3:4 frames. */
export function toFullFigure(src: string) {
  if (src.startsWith("https://images.unsplash.com/") || src.startsWith("https://images.pexels.com/")) {
    try {
      const url = new URL(src);
      const w = Math.max(800, Number(url.searchParams.get("w") || 900));
      const h = Math.round((w * 4) / 3);
      if (src.startsWith("https://images.unsplash.com/")) {
        url.searchParams.set("auto", "format");
        url.searchParams.set("fit", "crop");
        url.searchParams.set("crop", "top");
        url.searchParams.set("w", String(w));
        url.searchParams.set("h", String(h));
      } else {
        url.searchParams.set("auto", "compress");
        url.searchParams.set("cs", "tinysrgb");
        url.searchParams.set("fit", "crop");
        url.searchParams.set("w", String(w));
        url.searchParams.set("h", String(h));
      }
      return url.toString();
    } catch {
      return src;
    }
  }
  return src;
}
