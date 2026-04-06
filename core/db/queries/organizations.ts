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

export async function getOrganizationByIdForSidebar(orgId: string) {
  return prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, plan: true },
  });
}

export async function getOrganizationByUserId(userId: string) {
    const membership = await prisma.membership.findFirst({
        where: { userId },
        include: { organization: true },
    });

    return membership?.organization ?? null;
}

export async function getOrgsWithMembershipByUserId(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { organization: true },
  });

  return memberships;
}