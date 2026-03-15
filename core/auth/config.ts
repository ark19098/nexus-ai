// Node-Safe Config
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../db/client";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  callbacks: {
    ...authConfig.callbacks,
    // Attach data to the token (The heavy DB query runs HERE (Node.js API route), not on the Edge)
    async jwt({ token, user }) {
        // Add user ID to JWT token
        if (user) {
            token.id = user.id;
            
            const dbUser = await prisma.user.findUnique({
                where: { id: token.id as string },
                include: { memberships: true },
            });

            if (dbUser && dbUser.memberships.length > 0) {
                token.id = dbUser.id;
                token.orgId = dbUser.memberships[0].organizationId;
                token.role = dbUser.memberships[0].role;
            } else {
                token.orgId = null;
                token.role = null;
            }
        }
        return token;
    },
  },
});