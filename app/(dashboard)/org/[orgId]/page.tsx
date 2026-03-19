import { redirect } from "next/navigation";
import { getWorkspacesByOrgId } from "@/core/db/queries/workspaces";

export default async function OrgTrafficCopPage({ params}: {
    params: Promise<{ orgId: string }>
}) {
    const { orgId } = await params;
    const workspaces = await getWorkspacesByOrgId(orgId);

    if (workspaces.length === 0) {
        redirect("/onboarding")
    }

    redirect(`/org/${orgId}/workspace/${workspaces[0].id}`)
}