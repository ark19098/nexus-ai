import { prisma } from "@/core/db/client";

export async function getDocumentById(id: string, orgId: string) {
    return prisma.document.findFirst({
        where: { id: id, organizationId: orgId, deletedAt: null},
    });
}

export async function getDocumentsByWorkspaceId(workspaceId: string, orgId: string) {
    return prisma.document.findMany({
        where: { workspaceId: workspaceId, organizationId: orgId, deletedAt: null },
        orderBy: { createdAt: "desc" },
    });

}

export async function updateDocumentStatus(
    id: string,
    orgId: string,
    status: "PENDING" | "PROCESSING" | "READY" | "FAILED"
) {
    return prisma.document.update({
        where: { id: id, organizationId: orgId },
        data: {
            status,
            ...(status === 'READY' && { vectorized: true }),
        },
    });

}