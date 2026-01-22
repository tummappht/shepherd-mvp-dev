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
      const tokenMaxAge = 15 * 60; // 15 minutes in seconds
      const refreshThreshold = 5 * 60; // Refresh if less than 5 minutes remaining

      // Set token expiry when user first logs in
      if (user && !token.customTokenExpiry) {
        token.customTokenExpiry = now + tokenMaxAge;
        token.customTokenIssued = now;
      }

      // Auto-refresh token if less than 5 minutes remaining
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
    maxAge: 15 * 60, // 15 minutes in seconds
  },
  secret: process.env.AUTH_SECRET,
};
