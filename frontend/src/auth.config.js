import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  providers: [Google, GitHub],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};
