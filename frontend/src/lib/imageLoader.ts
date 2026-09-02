export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const q = quality ?? 70;
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    const prevW = Number(url.searchParams.get("w") || width);
    const prevH = Number(url.searchParams.get("h") || 0);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", url.searchParams.get("fit") || "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(q));
    if (prevH && prevW) {
      url.searchParams.set("h", String(Math.max(1, Math.round((prevH / prevW) * width))));
    }
    return url.toString();
  }
  return src;
}
