import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { authConfig } from "./auth.config";
import { db } from "@/lib/firebase-admin";

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
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // First, run the original JWT callback from authConfig
      const baseToken = await authConfig.callbacks.jwt({
        token,
        user,
        account,
      });

      // Then, add our server-side Firebase logic (only on initial sign-in)
      if (user && user.email) {
        try {
          // Check if user's email is in eligible_emails collection
          const eligibleEmailsRef = db.collection("eligible_emails");
          const snapshot = await eligibleEmailsRef
            .where("email", "==", user.email)
            .limit(1)
            .get();

          baseToken.isEligible = !snapshot.empty;

          // Update user record asynchronously (don't wait for it)
          const usersRef = db.collection("users");
          usersRef
            .where("email", "==", user.email)
            .limit(1)
            .get()
            .then((userSnapshot) => {
              if (!userSnapshot.empty) {
                userSnapshot.docs[0].ref.update({
                  isEligible: baseToken.isEligible,
                  updatedAt: new Date().toISOString(),
                });
              }
            })
            .catch((error) =>
              console.error("Error updating user eligibility:", error)
            );
        } catch (error) {
          console.error("Error checking eligible emails:", error);
          // Keep the default value from base callback
        }
      }

      return baseToken;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(apiAuthConfig);
export const { GET, POST } = handlers;
