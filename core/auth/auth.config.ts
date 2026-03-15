// Edge-Safe Config (NO Prisma imports in this file, since Prisma is not Edge-compatible)
import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "../env/env.mjs";

export default {
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      return true;
    },
    // Expose token data to the client
    async session({ session, token }) {
        if (session.user) {
            session.user.id = token.id as string;
            session.user.orgId = token.orgId as string | null;
            session.user.role = token.role as string | null;
        }
        return session;
    },
  },
} satisfies NextAuthConfig;