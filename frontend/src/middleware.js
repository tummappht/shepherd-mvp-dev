import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import NextAuth from "next-auth";

// Initialize Auth.js middleware using the edge-safe configuration
const { auth } = NextAuth(authConfig);

// Define paths that are accessible without authentication
const publicPaths = ["/login"];

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Check if it's a static file
  const staticFileRegex =
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf)$/;
  const isStaticFile = staticFileRegex.exec(pathname);

  // Skip middleware for static files
  if (isStaticFile) {
    return;
  }

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
    //  Match all request paths except for the ones starting with:
    //  - api (API routes)
    //  - _next/static (static files)
    //  - _next/image (image optimization files)
    //  - favicon.ico (favicon file)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
