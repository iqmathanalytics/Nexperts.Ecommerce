import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!request.cookies.get("admin_token")?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  const needsCustomer =
    pathname.startsWith("/account") ||
    pathname === "/cart" ||
    pathname.startsWith("/checkout");

  if (needsCustomer && !request.cookies.get("customer_token")?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/cart", "/checkout", "/checkout/:path*"],
};
