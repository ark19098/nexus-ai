"use client"

import { useState, useEffect, useTransition }  from "react"
import { FileText, Clock, Trash2, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { deleteDocumentAction }     from "@/modules/documents/actions"

interface Document {
  id:        string
  name:      string
  status:    string
  createdAt: Date
  fileUrl:   string
}

interface Props {
  documents: Document[]
  orgId:     string
}

export default function DocumentList({ documents, orgId }: Props) {
  const [localDocs, setLocalDocs] = useState(documents)

  // Sync local state when the server sends a fresh documents array
  // (e.g. after router.refresh() following an upload or delete)
  useEffect(() => {
    setLocalDocs(documents)
  }, [documents])

  function handleDeleted(id: string) {
    setLocalDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div>
      <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-4">
        Workspace Documents ({localDocs.length})
      </h2>

      {localDocs.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg p-12 text-center">
          <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-600 text-sm">
            No documents yet. Upload a PDF above to begin.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <ul className="divide-y divide-zinc-800">
            {localDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                orgId={orgId}
                onDeleted={handleDeleted}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DocumentRow({
  document: doc,
  orgId,
  onDeleted,
}: {
  document:  Document
  orgId:     string
  onDeleted: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirm]  = useState(false)
  const [error, setError]            = useState<string | null>(null)

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirm(true)
      // Auto-reset confirm state after 3s
      setTimeout(() => setConfirm(false), 3000)
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await deleteDocumentAction(doc.id)
      if (result.error) {
        setError(result.error)
        setConfirm(false)
      } else {
        onDeleted(doc.id)
      }
    })
  }

  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-zinc-900/40 transition-colors group gap-3 sm:gap-0">
      {/* Left: icon + name + date */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-zinc-400" />
        </div>

        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{doc.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-zinc-600" />
            <p className="text-zinc-600 text-xs">
              {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
          {error && (
            <p className="text-red-400 text-xs mt-0.5">{error}</p>
          )}
        </div>
      </div>

      {/* Right: status + delete — always visible on mobile (no opacity-0 trick on small screens) */}
      <div className="flex items-center gap-3 shrink-0 pl-12 sm:pl-0">
        <StatusBadge status={doc.status} />

        <button
          onClick={handleDeleteClick}
          disabled={isPending}
          className={`
            p-1.5 rounded-md transition-colors
            ${confirmDelete
              ? "bg-red-950 border border-red-800 text-red-400 hover:bg-red-900"
              : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
            }
          `}
          title={confirmDelete ? "Click again to confirm delete" : "Delete document"}
        >
          {isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Trash2  className="w-4 h-4" />
          }
        </button>
      </div>
    </li>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    PENDING: {
      label:     "Pending",
      className: "bg-yellow-950 text-yellow-400 border-yellow-900",
      icon:      <Clock className="w-3 h-3" />,
    },
    PROCESSING: {
      label:     "Processing",
      className: "bg-blue-950 text-blue-400 border-blue-900",
      icon:      <RefreshCw className="w-3 h-3 animate-spin" />,
    },
    READY: {
      label:     "Ready",
      className: "bg-green-950 text-green-400 border-green-900",
      icon:      <CheckCircle className="w-3 h-3" />,
    },
    FAILED: {
      label:     "Failed",
      className: "bg-red-950 text-red-400 border-red-900",
      icon:      <AlertCircle className="w-3 h-3" />,
    },
  }

  const cfg = config[status] ?? config.PENDING!

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-medium ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}