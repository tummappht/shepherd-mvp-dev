import { signOut } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  await signOut({ redirect: false });

  return NextResponse.redirect(new URL("/login", request.url));
}
