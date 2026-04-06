'use server'

import { z } from "zod";
import { auth, update } from "@/core/auth/config";
import { redirect } from "next/navigation";
import { createOrgWithWorkspace } from "./services";
import { prisma } from "@/core/db/client";
import { CACHE_TAGS } from "@/core/redis/cache-tags";
import { revalidateTag } from "next/cache";

const CreateOrgSchema = z.object({
    orgName: z.string().min(2, "Organization name must be at least 3 characters").max(50),
    workspaceName: z.string().min(2, "Workspace name must be at least 3 characters").max(50),
});

const CreateWorkspaceSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
})

export async function createOrgAction(formData: FormData) {
    const session = await auth();

    console.log("[ACTION: CREATE ORG] Triggered by:", session?.user?.email);
    console.log("[ACTION: CREATE ORG] Current OrgId before update:", session?.user?.orgId);
    if (!session?.user) {
        redirect("/login");
    }

    const parsed = CreateOrgSchema.safeParse({
        orgName: formData.get("orgName"),
        workspaceName: formData.get("workspaceName") || "Default Workspace",
    });

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    // Call the pure service layer!
    const { org, workspace } = await createOrgWithWorkspace(
        session.user.id,
        parsed.data.orgName,
        parsed.data.workspaceName
    );

    // Refresh JWT cookie/Session (Call the server-side update function)
    await update({ user: { orgId: org.id, role: "OWNER", } });

    // Redirect deep into the new workspace shell
    redirect(`/org/${org.id}/workspace/${workspace.id}`);
}

export async function createWorkspaceAction(
    orgId: string,
    formData: FormData
): Promise<{ success?: boolean; error?: string; workspaceId?: string }> {

    const session = await auth()
    if (!session?.user?.id || session.user.orgId !== orgId) {
      return { error: "Unauthorized" }
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
        return { error: "Only owners and admins can create workspaces" }
    }

    const parsed = CreateWorkspaceSchema.safeParse({ name: formData.get("name") })
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const workspace = await prisma.workspace.create({
        data: {
          name:           parsed.data.name,
          organizationId: orgId,
        },
    });

    revalidateTag(CACHE_TAGS.workspaces(orgId));
    return { success: true, workspaceId: workspace.id };
}