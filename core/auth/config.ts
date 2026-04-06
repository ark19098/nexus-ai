// Node-Safe Config
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../db/client";
import authConfig from "./auth.config";
import { cookies } from "next/headers";
import {
  consumePendingInviteCookieForUser,
  invitationUsableForSigner,
} from "@/lib/pending-invite";
import type { Invitation } from "../db/generated";

export const { handlers, auth, signIn, signOut, unstable_update: update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user }) {
        console.log("[AUTH: SIGN-IN] User attempting login:", user.email);
        if (!user.email) return false;

        const cookieStore = await cookies();
        const inviteId = cookieStore.get("nexus_pending_invite")?.value;

        let pendingInvite: Invitation | null = null;

        if (inviteId) {
            const invitation = await prisma.invitation.findUnique({
                where: { id: inviteId },
            });
            if (invitationUsableForSigner(invitation, user.email)) {
                pendingInvite = invitation;
            }
        }

        // Find or create user
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { memberships: true },
        });

        if (!existingUser) {
            // New OAuth user: adapter hasn't written the row yet at this point.
            // Pending invite is consumed in the jwt callback after the row exists.
            return true;
        } else {
            // Existing user — handle joining a second org via invite
            if (pendingInvite) {
                const alreadyMember = existingUser.memberships.some(m =>
                    m.organizationId === pendingInvite.organizationId
                );

                if (!alreadyMember) {
                    await prisma.membership.create({
                        data: {
                            userId:         existingUser.id,
                            organizationId: pendingInvite.organizationId,
                            role:           pendingInvite.role,
                          },
                    });

                    await prisma.invitation.update({
                        where: { id: pendingInvite.id },
                        data: { acceptedAt: new Date() },
                    });

                    console.log("[AUTH: SIGN-IN] Existing user joined second org:", pendingInvite.organizationId);
                }
            } else {
                // EXISTING USER + NO INVITE → normal login
                // jwt callback loads their existing membership
                console.log("[AUTH: SIGN-IN] Existing user logged in:", existingUser.email);
            }
        }

        return true;
    },

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

            if (user.email) {
                await consumePendingInviteCookieForUser(user.id as string, user.email);
            }

            const dbUser = await prisma.user.findUnique({
                where: { id: token.id as string },
                include: { memberships: { orderBy: { createdAt: "desc" } } },
            });

            if (dbUser && dbUser.memberships.length > 0) {
                // First membership = default active org. Future multi-org: store activeOrgId on User model
                token.id = dbUser.id;
                token.orgId = dbUser.memberships[0].organizationId;
                token.role = dbUser.memberships[0].role;
            } else {
                // No membership — new user or invite pending (middleware → /onboarding)
                token.orgId = null;
                token.role = null;
            }
        }
        return token;
    },
  },
});