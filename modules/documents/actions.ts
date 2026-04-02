"use server"

import { z } from "zod"
import { auth } from "@/core/auth/config"
import { revalidateTag } from "next/cache"
import { createDocument } from "./services"
import { CACHE_TAGS } from "@/core/redis/cache-tags"
import { inngest } from "@/lib/inngest"
import { VectorizationInput } from "../rag/types"
import { prisma } from "@/core/db/client"

export async function revalidateDocumentsCache(orgId: string) {
  console.log("[REVALIDATE_DOCUMENTS_CACHE] Revalidating documents cache for orgId:", orgId)
  revalidateTag(CACHE_TAGS.documents(orgId))
}

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
        console.log(document, 'DOC SAVED PRISMA');

        await inngest.send({
            name: "document/process",
            data: {
                documentId: document.id,
                orgId: session.user.orgId,
                workspaceId: parsed.data.workspaceId,
                fileKey: parsed.data.fileKey,
                fileName: parsed.data.fileName,
            } satisfies VectorizationInput
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

export async function deleteDocumentAction(
  documentId: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id || !session.user.orgId) return { error: "Unauthorized" }
 
  const { orgId } = session.user
 
  // Verify document belongs to this org before touching anything
  const document = await prisma.document.findFirst({
    where: {
      id:             documentId,
      organizationId: orgId,
      deletedAt:      null,
    },
  })
 
  if (!document) return { error: "Document not found" }
 
  try {
    // 1. Soft-delete in PostgreSQL — preserves audit trail
    await prisma.document.update({
      where: { id: documentId },
      data:  { deletedAt: new Date() },
    })
 
    // 2. Hard-delete vectors from Pinecone — free up vector quota
    // Fire-and-forget — Pinecone cleanup failure should not block the UI
    // void deleteDocumentChunks(documentId, orgId).catch((err) => {
    //   console.error(`[DELETE_DOC] Pinecone cleanup failed for ${documentId}:`, err)
    // })
 
    // 3. Invalidate document list cache
    await revalidateDocumentsCache(orgId)
 
    return { success: true }
  } catch (err) {
    console.error("[DELETE_DOCUMENT]", err)
    return { error: "Failed to delete document" }
  }
}