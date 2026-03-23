"use server"

import { z } from "zod"
import { auth } from "@/core/auth/config"
import { revalidateTag } from "next/cache"
import { createDocument } from "./services"
import { CACHE_TAGS } from "@/core/redis/cache-tags"
import { inngest } from "@/lib/inngest"

const CreateDocumentSchema = z.object({
    fileName: z.string().min(1, "File name is required"),
    fileKey: z.string().min(1, "File key is required"),
    workspaceId: z.string().min(1, "Workspace ID is required"),
});

export async function createDocumentAction(data: {
    fileName: string
    fileKey: string
    workspaceId: string

}) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) {
        return { error: "Unauthorized" };
    }

    const parsed = CreateDocumentSchema.safeParse(data);
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    try {
        // 3. Call service layer — no Prisma here
        const document = await createDocument({
            fileName: parsed.data.fileName,
            fileKey: parsed.data.fileKey,
            workspaceId: parsed.data.workspaceId,
            organizationId: session.user.orgId,
            userId: session.user.id,
        })

        await inngest.send({
            name: "document/process",
            data: {
                documentId: document.id,
                orgId: session.user.orgId,
                workspaceId: parsed.data.workspaceId
            }
        });

        // 4. Invalidate document list cache — NOT router.refresh()
        revalidateTag(CACHE_TAGS.documents(session.user.orgId))

        // TODO: Fire Inngest event for background processing
        // await inngest.send({
        //   name: "document/process",
        //   data: { documentId: document.id, orgId: session.user.orgId }
        // })
        return { success: true, document }
  } catch (error) {
    console.error("[CREATE_DOCUMENT_ERROR]", error)
    return { error: "Failed to save document" }
  }

}