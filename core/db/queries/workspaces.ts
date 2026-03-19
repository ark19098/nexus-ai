import { prisma } from "../client";

export async function getWorkspaceById(workspaceId: string, orgId: string) {
    return prisma.workspace.findFirst({
        where: { id: workspaceId, organizationId: orgId },
    });
}

export async function getWorkspacesByOrgId(orgId: string) {
    return prisma.workspace.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
    });
}