import { signOut } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  // Sign out the user programmatically
  await signOut({ redirect: false });

  // Redirect to login page
  return NextResponse.redirect(new URL("/login", request.url));
}
