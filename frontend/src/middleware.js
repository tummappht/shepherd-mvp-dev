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
  const baseUrl = req.url;

  if (!session) {
    const isPublic = publicPaths.some((path) => path === pathname);
    if (!isPublic) {
      return NextResponse.redirect(new URL("/login", baseUrl));
    }
  }
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", baseUrl));
  }
});

// CRITICAL: The matcher must exclude all paths handled by the Auth.js API.
// Note: This pattern assumes your API handler is in /api/auth/[...nextauth]
export const config = {
  matcher: [
    //Match all paths except for the ones starting with /api/auth, /_next/static, /_next/image, favicon.ico, and any common static file extensions
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(png|jpg|jpeg|svg|webp|ico|css|js|woff|woff2|ttf|map)).*)",
  ],
};
