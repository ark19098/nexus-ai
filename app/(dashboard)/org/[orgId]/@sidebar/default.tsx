import { auth } from "@/core/auth/config"
import { getWorkspacesByOrgId } from "@/core/db/queries/workspaces"
import Sidebar from "../_components/Sidebar"
import { prisma } from "@/core/db/client";

export default async function SidebarSlot({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
    const { orgId } = await params;
    const session = await auth();

    // Sidebar fetches its own data independently
    const workspaces = await getWorkspacesByOrgId(orgId);

    const isOwner = session?.user?.role === "OWNER";
    
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, plan: true },
    });

    const plan = org?.plan ?? "FREE";

    return (
        <Sidebar
            orgId={orgId}
            workspaces={workspaces}
            userEmail={session?.user?.email ?? ""}
            userName={session?.user?.name ?? ""}
            isOwner={isOwner}
            plan={plan}

        />
    );
}