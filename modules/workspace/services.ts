import { prisma } from "@/core/db/client";

export async function createOrgWithWorkspace(
  userId: string,
  orgName: string,
  workspaceName: string
) {
    // 1. Create the Organization
    const org = await prisma.organization.create({
        data: {
            name: orgName,
        }
    });

    // 2. Create the Membership (Link user to org as OWNER)
    await prisma.membership.create({
        data: {
            userId,
            organizationId: org.id,
            role: "OWNER",
        }
    });

    // 3. Create the first default Workspace inside the Organization
    const workspace = await prisma.workspace.create({
        data: {
            name: workspaceName,
            organizationId: org.id,
        }
    });

    return { org, workspace };
}