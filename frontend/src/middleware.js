// import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import NextAuth from "next-auth";

// Initialize Auth.js middleware using the edge-safe configuration
const { auth } = NextAuth(authConfig);

// Define paths that are accessible without authentication
const publicPaths = ["/login"];

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;

  const sessionAuth = await auth();
  const session = req.auth;
  console.log("🚀 ~ middleware ~ req:", req);
  console.log("🚀 ~ middleware ~ sessionAuth:", sessionAuth);
  console.log("🚀 ~ middleware ~ session:", session);
  console.log("🚀 ~ middleware ~ pathname:", pathname);
  // if (!session) {
  //   const isPublic = publicPaths.some((path) => path === pathname);
  //   console.log("🚀 ~ middleware ~ isPublic:", isPublic);
  //   if (!isPublic) {
  //     return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  //   }
  // }
  // if (session && pathname === "/login") {
  //   return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  // }
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
