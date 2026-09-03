import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  // fetch() decompresses gzip; forwarding these makes Chrome fail with ERR_CONTENT_DECODING_FAILED.
  "content-encoding",
  "accept-encoding",
]);

function normalizeBase(raw?: string | null) {
  if (!raw?.trim()) return "";
  return raw.trim().replace(/\/$/, "").replace(/\/api\/v1$/i, "");
}

function candidateBases() {
  const bases: string[] = [];
  const add = (raw?: string | null) => {
    const cleaned = normalizeBase(raw);
    if (cleaned && !bases.includes(cleaned)) bases.push(cleaned);
  };
  add(process.env.API_PROXY_TARGET);
  add(process.env.NEXT_PUBLIC_API_URL);
  const hasRemote = bases.some((b) => !/localhost|127\.0\.0\.1/i.test(b));
  // Local fallbacks are only for a fully local API. Mixing Render + localhost
  // turns a slow checkout into a 401 from the other origin and looks like logout.
  if (process.env.NODE_ENV !== "production" && !hasRemote) {
    add("http://127.0.0.1:4010");
    add("http://localhost:4010");
    add("http://127.0.0.1:4000");
  }
  return bases.length ? bases : ["http://127.0.0.1:4010"];
}

function timeoutMs(method: string, suffix: string) {
  if (method !== "GET" && method !== "HEAD" && /\/checkout(?:\?|$)/.test(suffix)) return 45_000;
  if (method !== "GET" && method !== "HEAD" && /\/(?:media|images|logo|hero)(?:\/|\?|$)/.test(suffix)) return 30_000;
  return 15_000;
}

/** Bind auth cookies to the storefront host (first-party) instead of Render. */
function rewriteSetCookie(raw: string, reqUrl: URL) {
  let out = raw.replace(/;\s*Domain=[^;]*/gi, "");
  out = out.replace(/;\s*SameSite=[^;]*/gi, "");
  out = out.replace(/;\s*Secure/gi, "");
  if (reqUrl.protocol === "https:") {
    out += "; Secure; SameSite=Lax";
  } else {
    out += "; SameSite=Lax";
  }
  return out;
}

async function proxy(req: NextRequest, pathSegments: string[]) {
  const reqUrl = new URL(req.url);
  const suffix = `/api/v1/${pathSegments.join("/")}${reqUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  // Ask Express for plain JSON so Node/undici cannot decode gzip then still advertise it.
  headers.set("accept-encoding", "identity");

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    // Buffer the body so retries and Node/Cloudflare runtimes both work.
    init.body = await req.arrayBuffer();
  }

  const mutating = req.method !== "GET" && req.method !== "HEAD";
  const bases = mutating ? candidateBases().slice(0, 1) : candidateBases();
  const waitFor = timeoutMs(req.method, suffix);

  let upstream: Response | undefined;
  for (const base of bases) {
    try {
      upstream = await fetch(`${base}${suffix}`, { ...init, signal: AbortSignal.timeout(waitFor) });
      break;
    } catch {
      /* try the next origin only for idempotent reads */
    }
  }

  if (!upstream) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Unable to reach the API. Start the backend on port 4010 and refresh.",
        },
      },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") return;
    if (HOP_BY_HOP.has(lower)) return;
    outHeaders.set(key, value);
  });

  const rawCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : upstream.headers.get("set-cookie")
        ? [upstream.headers.get("set-cookie")!]
        : [];

  for (const cookie of rawCookies) {
    outHeaders.append("set-cookie", rewriteSetCookie(cookie, reqUrl));
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

type Ctx = { params: Promise<{ path: string[] }> | { path: string[] } };

async function handle(req: NextRequest, ctx: Ctx) {
  const resolved = await ctx.params;
  return proxy(req, resolved.path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
