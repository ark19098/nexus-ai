"use server"

import { auth } from "@/core/auth/config";
import { prisma } from "@/core/db/client";
import { CACHE_TAGS } from "@/core/redis/cache-tags";
import { revalidateTag } from "next/cache";

export async function createConversationAction(
    wsId: string,
    orgId: string,
    title: string
): Promise<{ conversationId?: string; error?: string; }> {
    const session = await auth();
    if (!session?.user || session.user.orgId !== orgId) {
        return { error: "Unauthorized" };
    }

    const conversation = await prisma.conversation.create({
        data: {
            workspaceId: wsId,
            organizationId: orgId,
            title: title.slice(0, 100),
            createdBy: session.user.id,
        },
    });

    revalidateTag(CACHE_TAGS.organization(orgId));

    return { conversationId: conversation.id };

}

export async function deleteConversationAction(
    conversationId: string,
    orgId: string
): Promise<{ success?: boolean; error?: string; }> {
    const session = await auth();
    if (!session?.user || session.user.orgId !== orgId) {
        return { error: "Unauthorized" };
    }

    // Verify ownership before delete
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, organizationId: orgId },
    });
    if (!conversation) return { error: "Conversation not found" };

    await prisma.conversation.delete({ where: { id: conversationId } });
    revalidateTag(CACHE_TAGS.organization(orgId));

    return { success: true };
}