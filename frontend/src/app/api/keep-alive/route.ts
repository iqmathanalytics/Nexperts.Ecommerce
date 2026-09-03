import { NextResponse } from "next/server";

export const runtime = "edge";

function upstreamBase() {
  const explicit = process.env.API_PROXY_TARGET?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const publicUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4010/api/v1";
  return publicUrl.replace(/\/api\/v1\/?$/, "") || "http://127.0.0.1:4010";
}

/** Pings the API so Render does not spin down after idle time. */
export async function GET() {
  try {
    const res = await fetch(`${upstreamBase()}/health`, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
