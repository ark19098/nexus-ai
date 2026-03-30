import { prisma } from "../client";

export async function getConversationById(conversationId: string, orgId: string, wsId: string) {
    return prisma.conversation.findFirst({
        where: {
          id:             conversationId,
          organizationId: orgId,
          workspaceId:    wsId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id:           true,
              role:         true,
              content:      true,
              sourceChunks: true,
              createdAt:    true,
            },
          },
        },
    });
}

export async function getConversationsByWorkspace(wsId: string, orgId: string) {
    return prisma.conversation.findMany({
        where:   { organizationId: orgId, workspaceId: wsId },
        orderBy: { createdAt: "desc" },
        take:    50,
        select: {
          id:        true,
          title:     true,
          createdAt: true,
          messages: {
            orderBy: { createdAt: "asc" },
            take:    1,
            select:  { content: true },
          },
        },
    });
}