import { prisma } from "@/core/db/client"

interface CreateDocumentInput {
  fileName: string
  fileKey: string
  workspaceId: string
  organizationId: string
  userId: string
}

export async function createDocument(input: CreateDocumentInput) {
  const { fileName, fileKey, workspaceId, organizationId } = input

  return prisma.document.create({
    data: {
      name: fileName,
      fileUrl: fileKey,
      status: "PENDING",
      workspaceId,
      organizationId,
      vectorized: false,
    },
  })
}

export async function softDeleteDocument(id: string, orgId: string) {
  return prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}