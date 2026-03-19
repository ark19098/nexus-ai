// Node-Safe Config
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../db/client";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut, unstable_update: update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  callbacks: {
    ...authConfig.callbacks,
    // Attach data to the token (The heavy DB query runs HERE (Node.js API route), not on the Edge)
    async jwt({ token, user, session, trigger }) {
        // When update() is called, apply the new orgId to the token
        if (trigger === "update" && session?.user) {
            console.log("[AUTH: JWT UPDATE] Session refreshed for:", token);
            token.orgId = session.user.orgId;
            token.role = session.user.role;
            return token; 
        }

        // Add user ID to JWT token
        if (user) {
            console.log("[AUTH: JWT CREATED] New token minted for:", user);
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