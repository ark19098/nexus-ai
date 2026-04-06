import { auth }                              from "@/core/auth/config"
import { getWorkspacesByOrgId }             from "@/core/db/queries/workspaces"
import { getOrganizationByIdForSidebar, getOrgsWithMembershipByUserId }    from "@/core/db/queries/organizations"
import Sidebar                              from "../_components/Sidebar"

export default async function SidebarSlot({
  params,
}: {
  params: Promise<{ orgId: string; wsId?: string }>
}) {
  const { orgId, wsId } = await params
  const session = await auth()
  if (!session?.user) return null

  const [workspaces, org, userOrgs] = await Promise.all([
    getWorkspacesByOrgId(orgId),
    getOrganizationByIdForSidebar(orgId),
    getOrgsWithMembershipByUserId(session.user.id),
  ])

  const isOwner  = session.user.role === "OWNER"
  const canCreate = ["OWNER", "ADMIN"].includes(session.user.role ?? "")
  const plan      = org?.plan ?? "FREE"

  return (
    <Sidebar
      orgId={orgId}
      wsId={wsId ?? workspaces[0]?.id ?? ""}
      workspaces={workspaces}
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      isOwner={isOwner}
      canCreate={canCreate}
      plan={plan}
      userOrgs={userOrgs}
    />
  )
}
