import { auth } from "@/core/auth/config"
import { getWorkspacesByOrgId } from "@/core/db/queries/workspaces"
import Sidebar from "../_components/Sidebar"

export default async function SidebarSlot({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
    const { orgId } = await params;
    const session = await auth();

    // Sidebar fetches its own data independently
    const workspaces = await getWorkspacesByOrgId(orgId);

    return (
        <Sidebar
            orgId={orgId}
            workspaces={workspaces}
            userEmail={session?.user?.email ?? ""}
            userName={session?.user?.name ?? ""}
        />
    );
}