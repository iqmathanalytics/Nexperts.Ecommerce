import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_GATES } from "@/lib/sessionGate";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API JWTs are hosted on a different origin in production. Middleware only
  // checks soft same-origin gates set after a successful browser login.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!request.cookies.get(SESSION_GATES.admin)?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  const needsCustomer =
    pathname.startsWith("/account") ||
    pathname === "/cart" ||
    pathname.startsWith("/checkout");

  if (needsCustomer && !request.cookies.get(SESSION_GATES.customer)?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/cart", "/checkout", "/checkout/:path*"],
};
