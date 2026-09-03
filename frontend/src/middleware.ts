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

  // /cart stays public so guest bags work; checkout/account still require a session.
  const needsCustomer =
    pathname.startsWith("/account") ||
    (pathname.startsWith("/checkout") && pathname !== "/checkout/success");

  if (needsCustomer && !request.cookies.get(SESSION_GATES.customer)?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Run on pages (for x-pathname / intro cover) and protected routes.
     * Skip Next internals, static assets, and the API proxy.
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
