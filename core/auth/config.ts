// Node-Safe Config
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../db/client";
import authConfig from "./auth.config";
import { cookies } from "next/headers";
import { Role } from "../db/generated";

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

        let pendingInvite: { id: string; organizationId: string; email: string; role: Role } | null = null;

        if (inviteId) {
            const invitation = await prisma.invitation.findUnique({
                where: { id: inviteId },
            });

            // Validate invite: exists, not expired, not accepted, email matches
            if (
                invitation &&
                invitation.expiresAt > new Date() &&
                invitation.acceptedAt === null &&
                invitation.email.toLowerCase() === user.email.toLowerCase()
            ) {
                pendingInvite = invitation;
            }
        }

        // Find or create user
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { memberships: true },
        });

        if (!existingUser) {
            // PrismaAdapter creates the User record automatically
            // We wait for it by finding the user after adapter runs
            // signIn fires after adapter — user should exist now
            const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
            if (!dbUser) return true;  // adapter will create it, let it proceed

            if (pendingInvite) {
                await prisma.membership.create({
                    data: {
                        userId: dbUser.id,
                        organizationId: pendingInvite.organizationId,
                        role: pendingInvite.role,
                    },
                });

                await prisma.invitation.update({
                    where: { id: pendingInvite.id },
                    data: { acceptedAt: new Date() },
                });
            } else {
                // NEW USER + NO INVITE → do nothing
                // orgId will be null in JWT → middleware sends to /onboarding
                // createOrgAction on onboarding form handles org + workspace creation
            }

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