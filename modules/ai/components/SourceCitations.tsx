import { cn } from "@/lib/utils"
import { FileText } from "lucide-react"
import { useState } from "react"

type SourceChunk = {
  id: string
  fileName: string
  chunkIndex: number
  content: string
}

export default function SourceCitations({ sources }: { sources: SourceChunk[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="w-full space-y-1.5 px-1">
      <p className="text-zinc-600 text-xs uppercase tracking-wider font-medium">
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((src, idx) => (
          <button
            key={`${src.id}-${idx}`}
            onClick={() => setExpanded(expanded === src.id ? null : src.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors",
              expanded === src.id
                ? "bg-cyan-950 border-cyan-800 text-cyan-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
            )}
            title="Click to preview chunk"
          >
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[140px]">{src.fileName}</span>
            <span className="text-zinc-600">·{src.chunkIndex + 1}</span>
          </button>
        ))}
      </div>

      {/* Expanded chunk preview */}
      {expanded && (
        <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-6">
            {sources.find((s) => s.id === expanded)?.content}
          </p>
        </div>
      )}
    </div>
  )
}