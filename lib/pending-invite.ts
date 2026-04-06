import { cookies } from "next/headers";
import { prisma } from "@/core/db/client";
import type { Invitation } from "@/core/db/generated";

const PENDING_INVITE_COOKIE = "nexus_pending_invite";

/** Shared rules: not expired, not accepted, invite email matches the signing user's email. */
export function invitationUsableForSigner(
  invitation: Invitation | null,
  signerEmail: string
): invitation is Invitation {
  return (
    invitation !== null &&
    invitation.expiresAt > new Date() &&
    invitation.acceptedAt === null &&
    invitation.email.toLowerCase() === signerEmail.toLowerCase()
  );
}

/**
 * For brand-new OAuth users, `signIn` runs before the user row exists.
 * Call this from the jwt callback after the adapter has persisted the user.
 */
export async function consumePendingInviteCookieForUser(
  userId: string,
  email: string
): Promise<void> {
  const cookieStore = await cookies();
  const inviteId = cookieStore.get(PENDING_INVITE_COOKIE)?.value;
  if (!inviteId) return;

  const invitation = await prisma.invitation.findUnique({ where: { id: inviteId } });
  if (invitationUsableForSigner(invitation, email)) {
    const alreadyMember = await prisma.membership.findFirst({
      where: { userId, organizationId: invitation.organizationId },
    });
    if (!alreadyMember) {
      await prisma.membership.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    }
  }

  cookieStore.delete(PENDING_INVITE_COOKIE);
}
