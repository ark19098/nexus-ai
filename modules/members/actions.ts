'use server'

import { auth } from "@/core/auth/config";
import { prisma } from "@/core/db/client";
import { Role } from "@/core/db/generated";
import { env } from "@/core/env/env.mjs";
import { CACHE_TAGS } from "@/core/redis/cache-tags";
import { sendInviteEmail } from "@/lib/email";
import { generateInviteToken } from "@/lib/invite";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const InviteSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export async function inviteMemberAction(orgId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) {
        return { error: "Unauthorized" };
    }

    // Only OWNER and ADMIN can invite
    if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
        return { error: "Only owners and admins can invite members" };
    }

    const parsed = InviteSchema.safeParse({
        email: formData.get("email"),
        role: formData.get("role"),
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { email, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if already a member
    const existingMember = await prisma.membership.findFirst({
        where: {
            organizationId: orgId,
            user: { email: normalizedEmail },
        },
    });

    if (existingMember) {
        return { error: "This user is already a member of your organization" };
    }

    // Only OWNER can invite ADMIN
    if (role === "ADMIN" && session.user.role !== "OWNER") {
        return { error: "Only owners can invite admins" };
    }

    // Delete any existing invitation for this email+org
    await prisma.invitation.deleteMany({
        where: { email: normalizedEmail, organizationId: orgId },
    });

    const { rawToken, tokenHash } = generateInviteToken();

    await prisma.invitation.create({
        data: {
            email: normalizedEmail,
            organizationId: orgId,
            role,
            tokenHash,
            invitedById: session.user.id,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        },
    });

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
    });
    const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/api/invite/${rawToken}`;

    try {
        
        await sendInviteEmail(
            normalizedEmail,
            inviteUrl,
            org?.name ?? "your organization",
            session.user.name ?? "A team member"
        );
    } catch (error) {
        console.error("[INVITE] Failed to send invite email:", error);
        // Don't fail the action — return invite URL as fallback
        return { success: true, inviteUrl }
    }

    revalidateTag(CACHE_TAGS.organization(orgId));
    return { success: true };
}

export async function removeMemberAction(orgId: string, membershipId: string) {
    const session = await auth()
    if (!session?.user?.id || session.user.orgId !== orgId) {
      return { error: "Unauthorized" }
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
        return { error: "Only owners and admins can remove members" }
    }

    const membership = await prisma.membership.findFirst({
        where: { id: membershipId, organizationId: orgId },
    });

    if (!membership) return { error: "Member not found" };

    // Cannot remove yourself
    if (membership.userId === session.user.id) {
        return { error: "You cannot remove yourself from the organization" }
    }

    // Cannot remove OWNER unless you are OWNER
    if (membership.role === "OWNER" && session.user.role !== "OWNER") {
        return { error: "Only owners can remove other owners" }
    }

    // Ensure at least one OWNER remains
    if (membership.role === "OWNER") {
        const ownerCount = await prisma.membership.count({
            where: { organizationId: orgId, role: "OWNER" },
        });
        if (ownerCount <= 1) {
            return { error: "Cannot remove the last owner of the organization" }
        }
    }

    await prisma.membership.delete({ where: { id: membershipId } });
    revalidateTag(CACHE_TAGS.organization(orgId));
    return { success: true };
}

export async function changeMemberRoleAction(orgId: string, membershipId: string, newRole: Role

): Promise<{ success?: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id || session.user.orgId !== orgId) {
      return { error: "Unauthorized" }
    }
   
    // Only OWNER can change roles
    if (session.user.role !== "OWNER") {
      return { error: "Only owners can change member roles" }
    }
   
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, organizationId: orgId },
    })
    if (!membership) return { error: "Member not found" };

    if (membership.userId === session.user.id) {
        return { error: "You cannot change your own role" }
    }
    if (membership.role === "OWNER") {
        return { error: "Cannot change the role of another owner" }
    }

    await prisma.membership.update({
        where: { id: membershipId },
        data:  { role: newRole },
    });
     
    revalidateTag(CACHE_TAGS.organization(orgId))

    return { success: true };
}

export async function cancelInviteAction(
    orgId:      string,
    inviteId:   string
  ): Promise<{ success?: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id || session.user.orgId !== orgId) {
      return { error: "Unauthorized" }
    }
   
    if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
      return { error: "Unauthorized" }
    }
   
    await prisma.invitation.deleteMany({
      where: { id: inviteId, organizationId: orgId },
    });
   
    revalidateTag(CACHE_TAGS.organization(orgId))
    return { success: true }
}