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
  const w = Math.min(Math.max(1, width), 1800);

  if (src.startsWith("https://images.unsplash.com/") || src.startsWith("https://images.pexels.com/")) {
    try {
      const url = new URL(src);
      const existingW = Number(url.searchParams.get("w") || 0);
      const existingH = Number(url.searchParams.get("h") || 0);
      const isLandscape = existingW > 0 && existingH > 0 && existingH / existingW <= 0.8;
      const h = isLandscape
        ? Math.round(w * (existingH / existingW))
        : Math.round((w * 4) / 3);

      if (src.startsWith("https://images.unsplash.com/")) {
        url.searchParams.set("auto", "format");
        url.searchParams.set("fit", "crop");
        url.searchParams.set("crop", isLandscape ? url.searchParams.get("crop") || "entropy" : "top");
        url.searchParams.set("w", String(w));
        url.searchParams.set("h", String(h));
        url.searchParams.set("q", String(q));
        url.searchParams.set("fm", "webp");
      } else {
        url.searchParams.set("auto", "compress");
        url.searchParams.set("cs", "tinysrgb");
        url.searchParams.set("fit", "crop");
        url.searchParams.set("w", String(w));
        url.searchParams.set("h", String(h));
        url.searchParams.set("q", String(q));
      }
      return url.toString();
    } catch {
      return src;
    }
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

/** Wide cinematic crop for category / lookbook / designer heroes (16:9), subject-centered. */
export function toHeroBanner(src: string, width = 1800) {
  if (src.startsWith("https://images.unsplash.com/") || src.startsWith("https://images.pexels.com/")) {
    try {
      const url = new URL(src);
      const w = Math.min(Math.max(width, 1200), 2000);
      const h = Math.round((w * 9) / 16);
      if (src.startsWith("https://images.unsplash.com/")) {
        url.searchParams.set("auto", "format");
        url.searchParams.set("fit", "crop");
        url.searchParams.set("crop", "faces");
        url.searchParams.set("w", String(w));
        url.searchParams.set("h", String(h));
        url.searchParams.set("q", "62");
      } else {
        url.searchParams.set("auto", "compress");
        url.searchParams.set("cs", "tinysrgb");
        url.searchParams.set("fit", "crop");
        url.searchParams.set("w", String(w));
        url.searchParams.set("h", String(h));
        url.searchParams.set("q", "62");
      }
      return url.toString();
    } catch {
      return src;
    }
  }
  return src;
}
