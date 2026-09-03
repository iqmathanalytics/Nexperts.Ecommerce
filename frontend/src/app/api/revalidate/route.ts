import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "edge";

const DEFAULT_PATHS = ["/", "/women", "/men", "/sale", "/lookbooks", "/designers", "/products"];

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET || process.env.NEXT_PUBLIC_REVALIDATE_SECRET;
  const header = req.headers.get("x-revalidate-secret");
  if (!secret || header !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let paths = DEFAULT_PATHS;
  try {
    const body = (await req.json()) as { paths?: string[] };
    if (Array.isArray(body.paths) && body.paths.length) {
      paths = body.paths.filter((p) => typeof p === "string" && p.startsWith("/"));
    }
  } catch {
    /* use defaults */
  }

  for (const path of paths) {
    revalidatePath(path);
  }
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, revalidated: paths });
}
