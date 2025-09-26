import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  // providers: [
  //   GoogleProvider({
  //     clientId: process.env.AUTH_GOOGLE_ID,
  //     clientSecret: process.env.AUTH_GOOGLE_SECRET,
  //   }),
  //   GitHubProvider({
  //     clientId: process.env.AUTH_GITHUB_ID,
  //     clientSecret: process.env.AUTH_GITHUB_SECRET,
  //   }),
  // ],
  providers: [Google, GitHub],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};
