import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  providers: [Google, GitHub],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isEligible = user.isEligible || false;
      }

      const now = Math.floor(Date.now() / 1000);
      const tokenMaxAge = 60 * 60; // 1 hour in seconds
      const refreshThreshold = 30 * 60; // Refresh if less than 30 minutes remaining

      // Set token expiry when user first logs in
      if (user && !token.customTokenExpiry) {
        token.customTokenExpiry = now + tokenMaxAge;
        token.customTokenIssued = now;
      }

      // Check if custom token needs refresh (less than 30 minutes remaining)
      if (
        token.customTokenExpiry &&
        token.customTokenExpiry - now < refreshThreshold
      ) {
        // Refresh the token expiry
        token.customTokenExpiry = now + tokenMaxAge;
        token.customTokenIssued = now;
      }

      return token;
    },
    async session({ session, token }) {
      if (!token) {
        return null;
      }

      session.user.id = token.sub || token.id;
      session.user.isEligible = token.isEligible;

      // Store token metadata for client-side use
      session.customTokenIssued = token.customTokenIssued;
      session.customTokenExpiry = token.customTokenExpiry;

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour in seconds
  },
  secret: process.env.AUTH_SECRET,
};
