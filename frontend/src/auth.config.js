import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.DESMOND_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.DESMOND_AUTH_GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.DESMOND_AUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.DESMOND_AUTH_GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      const now = Math.floor(Date.now() / 1000);
      const tokenMaxAge = 15 * 24 * 60 * 60; // 15 days in seconds
      const refreshThreshold = 7 * 24 * 60 * 60; // Refresh if less than 7 days remaining

      // Set token expiry when user first logs in
      if (user && !token.customTokenExpiry) {
        token.customTokenExpiry = now + tokenMaxAge;
        token.customTokenIssued = now;
      }

      // Check if custom token needs refresh (less than 7 days remaining)
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

      // Store token metadata for client-side use
      session.customTokenIssued = token.customTokenIssued;
      session.customTokenExpiry = token.customTokenExpiry;

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days - longer than custom token to allow for refresh
  },
  secret: process.env.AUTH_SECRET,
};
