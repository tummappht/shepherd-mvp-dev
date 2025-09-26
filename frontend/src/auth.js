import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { authConfig } from "./auth.config";

const serviceAccount = {
  projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
  clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

const apiAuthConfig = {
  ...authConfig,
  adapter: FirestoreAdapter({ credential: cert(serviceAccount) }),
  session: { strategy: "jwt" },
};

export const { handlers, auth, signIn, signOut } = NextAuth(apiAuthConfig);
export const { GET, POST } = handlers;
