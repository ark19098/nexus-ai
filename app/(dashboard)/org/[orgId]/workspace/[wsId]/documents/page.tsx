import { getCachedDocumentsByWorkspaceId } from "@/modules/documents/queries"
import { UploadDropzone } from "@/modules/documents/components/UploadDropzone"
import { FileText, Clock } from "lucide-react"

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

      {/* Upload zone */}
      <UploadDropzone workspaceId={wsId} />

      {/* Document list */}
      <div>
        <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-4">
          Workspace Documents ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-lg p-12 text-center">
            <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-600 text-sm">
              No documents yet. Upload a PDF above to begin.
            </p>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <ul className="divide-y divide-zinc-800">
              {documents.map((doc: any) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <p className="text-zinc-600 text-xs">
                          {doc.createdAt.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <StatusBadge status={doc.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING:    "bg-yellow-950 text-yellow-400 border-yellow-900",
    PROCESSING: "bg-blue-950 text-blue-400 border-blue-900 animate-pulse",
    READY:      "bg-green-950 text-green-400 border-green-900",
    FAILED:     "bg-red-950 text-red-400 border-red-900",
  }

  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-md border font-medium tracking-wide flex-shrink-0 ${
        styles[status] ?? styles.PENDING
      }`}
    >
      {status}
    </span>
  )
}