import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as { role?: string })?.role;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?redirect=" + pathname, req.url));
    }
    if (role !== "ADMIN" && role !== "VENDEDOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect checkout/account
  if (pathname.startsWith("/checkout") || pathname.startsWith("/cuenta")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?redirect=" + pathname, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*", "/cuenta/:path*"],
};
