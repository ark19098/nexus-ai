import { getCachedDocumentsByWorkspaceId } from "@/modules/documents/queries"
import { UploadDropzone } from "@/modules/documents/components/UploadDropzone"
import { FileText, Clock } from "lucide-react"
import DocumentList from "@/modules/documents/components/DocumentList";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ orgId: string; wsId: string }>
}) {
  const { orgId, wsId } = await params

  const documents = await getCachedDocumentsByWorkspaceId(wsId, orgId);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">
          Knowledge Base
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Upload PDFs to vectorize them into your workspace for AI queries.
        </p>
      </div>

      <UploadDropzone workspaceId={wsId} />

      <DocumentList documents={documents} orgId={orgId} />
    </div>
  )
}