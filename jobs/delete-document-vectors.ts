import { deleteFromR2 } from "@/core/storage/s3";
import { inngest } from "@/lib/inngest";
import { deleteDocumentChunks } from "@/modules/rag/client/pinecone";

export interface DocumentDeletionInput {
  documentId: string
  orgId:       string
  fileName:    string  // document.name from Prisma
  fileKey:     string  // document.fileUrl from Prisma (stored as R2 object key)
}

export const deleteDocumentVectors = inngest.createFunction(
  {
    id:      "delete-document-vectors",
    name:    "Delete Document Vectors and R2 File",
    retries: 2,
    triggers: [{ event: "document/delete" }],
  },
  async ({ event }) => {
    const { documentId, orgId, fileName, fileKey } = event.data as DocumentDeletionInput

    console.log(`[JOB] Deleting document "${fileName}" (${documentId}) — org: ${orgId}`)

    // Delete Pinecone vectors and R2 file in parallel — independent operations
    const [pineconeResult, r2Result] = await Promise.allSettled([
      deleteDocumentChunks(documentId, orgId),
      deleteFromR2(fileKey),
    ])

    if (pineconeResult.status === "rejected") {
      console.error(`[JOB] Pinecone deletion failed for ${documentId}:`, pineconeResult.reason)
    } else {
      console.log(`[JOB] Pinecone vectors deleted for "${fileName}" (${documentId})`)
    }

    if (r2Result.status === "rejected") {
      console.error(`[JOB] R2 deletion failed for key "${fileKey}":`, r2Result.reason)
    } else {
      console.log(`[JOB] R2 file deleted: ${fileKey}`)
    }

    // Fail the job only if both deletions failed — partial success is acceptable
    if (pineconeResult.status === "rejected" && r2Result.status === "rejected") {
      throw new Error(
        `Both Pinecone and R2 deletion failed for document ${documentId}`
      )
    }

    return {
      documentId,
      orgId,
      pinecone: pineconeResult.status,
      r2:       r2Result.status,
    }
  }
)
