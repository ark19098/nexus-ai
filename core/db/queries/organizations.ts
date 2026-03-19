import { prisma } from "../client";

export async function getOrganizationById(orgId: string) {
  return prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      memberships: {
        include: { user: true },
      },
    },
  });
}

export async function getOrganizationByUserId(userId: string) {
    const membership = await prisma.membership.findFirst({
        where: { userId },
        include: { organization: true },
    });

    return membership?.organization ?? null;
}