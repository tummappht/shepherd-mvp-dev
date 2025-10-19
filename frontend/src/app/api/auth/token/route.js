import { auth } from "@/auth";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a custom JWT token with user data
    const payload = {
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
      id: session.user.id,
      iat: session.customTokenIssued || Math.floor(Date.now() / 1000),
      exp:
        session.customTokenExpiry ||
        Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60,
    };

    // Sign the JWT
    const token = jwt.sign(payload, process.env.AUTH_SECRET, {
      algorithm: "HS256",
    });

    return NextResponse.json({
      token,
      expiresAt: payload.exp,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
