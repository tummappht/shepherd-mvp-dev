import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import NextAuth from "next-auth";

// Initialize Auth.js middleware using the edge-safe configuration
const { auth } = NextAuth(authConfig);

// Define paths that are accessible without authentication
const publicPaths = ["/login"];

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = await auth();
  const vercelUrl = process.env.NEXTAUTH_URL;

  if (!session) {
    const isPublic = publicPaths.some((path) => path === pathname);

    if (!isPublic) {
      let redirectUrl = new URL("/login", req.url);

      if (vercelUrl && req.url.includes("localhost") === false) {
        redirectUrl = new URL("/login", vercelUrl);
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (session && pathname === "/login") {
    let redirectUrl = new URL("/", req.url);

    if (vercelUrl && req.url.includes("localhost") === false) {
      redirectUrl = new URL("/", vercelUrl);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Returning nothing (undefined) means continue to the next middleware/route
});

// CRITICAL: The matcher must exclude all paths handled by the Auth.js API.
// Note: This pattern assumes your API handler is in /api/auth/[...nextauth]
export const config = {
  matcher: [
    // Match all paths EXCEPT those starting with:
    // 1. /api/auth (the Auth.js API route)
    // 2. _next/ (Next.js internals)
    // 3. static files or favicon
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
