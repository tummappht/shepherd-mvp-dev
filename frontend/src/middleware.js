import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

// Define paths that are accessible without authentication
const PUBLIC_PATHS = ["/login"];
const LOGIN_PATH = "/login";
const HOME_PATH = "/";
// const FORCE_SIGNOUT_PATH = "/api/auth/force-signout";

// Regular expression to match static file extensions
const STATIC_FILE_REGEX =
  /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot|otf|map)$/i;

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (STATIC_FILE_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth;
  const baseUrl = req.url;

  const isEligible = session?.user?.isEligible === true;
  const hasSession = !!session?.user;
  console.log("🚀 ~ middleware ~ hasSession:", hasSession);

  // force sign-out for ineligible users
  // if (hasSession && !isEligible) {
  //   return NextResponse.redirect(new URL(FORCE_SIGNOUT_PATH, baseUrl));
  // }

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL(LOGIN_PATH, baseUrl));
  }

  console.log("🚀 ~ middleware ~ isEligible:", isEligible);
  if (hasSession && isEligible && pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL(HOME_PATH, baseUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/dashboard/:path*",
    "/mas-run/:path*",
    "/new-test/:path*",
  ],
};
