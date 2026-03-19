'use server'

import { z } from "zod";
import { auth, update } from "@/core/auth/config";
import { redirect } from "next/navigation";
import { createOrgWithWorkspace } from "./services";

const CreateOrgSchema = z.object({
    orgName: z.string().min(2, "Organization name must be at least 3 characters")
        .max(50, "Organization name must be less than 50 characters"),
    workspaceName: z.string().min(2, "Workspace name must be at least 3 characters")
        .max(50, "Workspace name must be less than 50 characters"),
});

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
    const { org, workspace } = await createOrgWithWorkspace(session.user.id, parsed.data.orgName, parsed.data.workspaceName);

    // Refresh JWT cookie/Session (Call the server-side update function)
    await update({
        user: {
            orgId: org.id,
            role: "OWNER",
        }
    });

    // Redirect deep into the new workspace shell
    redirect(`/org/${org.id}/workspace/${workspace.id}`);
    
}