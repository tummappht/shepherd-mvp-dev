import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { authConfig } from "./auth.config";

const rawPrivateKey = process.env.AUTH_FIREBASE_PRIVATE_KEY;
if (!rawPrivateKey) {
  // Warn instead of throwing so that build-time import doesn't crash with an unclear error
  // Vercel will surface a clearer warning; at runtime the adapter may still fail if credentials are required
  // but this avoids the `Cannot read properties of undefined (reading 'replace')` during build.
  console.warn(
    "AUTH_FIREBASE_PRIVATE_KEY is not set. Firebase adapter credential will be undefined."
  );
}

const serviceAccount = {
  projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
  clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
  privateKey: rawPrivateKey ? rawPrivateKey.replace(/\\n/g, "\n") : undefined,
};

const apiAuthConfig = {
  ...authConfig,
  adapter: FirestoreAdapter({ credential: cert(serviceAccount) }),
  session: { strategy: "jwt" },
};

export const { handlers, auth, signIn, signOut } = NextAuth(apiAuthConfig);
export const { GET, POST } = handlers;
