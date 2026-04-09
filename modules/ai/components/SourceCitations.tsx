import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, FileText } from "lucide-react"
import { useState } from "react"

type SourceChunk = {
  id: string
  fileName: string
  chunkIndex: number
  content: string
}

export default function SourceCitations({ sources }: { sources: SourceChunk[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll]   = useState(false)
 
  const visible = showAll ? sources : sources.slice(0, 4)
  const hasMore = sources.length > 4
 
  return (
    <div className="w-full space-y-2 px-1">
      <p className="text-zinc-600 text-xs font-medium uppercase tracking-wider">
        Sources ({sources.length})
      </p>
 
      <div className="flex flex-wrap gap-1.5">
        {visible.map((src, idx) => (
          <button
            key={`${src.id}-${idx}`}
            onClick={() => setExpanded(expanded === src.id ? null : src.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors max-w-[200px]",
              expanded === src.id
                ? "bg-cyan-950 border-cyan-800 text-cyan-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
            )}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">{src.fileName}</span>
            <span className="text-zinc-600 shrink-0">·{src.chunkIndex + 1}</span>
          </button>
        ))}
 
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
          >
            {showAll
              ? <><ChevronUp className="w-3 h-3" /> Less</>
              : <><ChevronDown className="w-3 h-3" /> +{sources.length - 4} more</>
            }
          </button>
        )}
      </div>
 
      {/* Expanded chunk preview */}
      {expanded && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <p className="text-cyan-500 text-xs font-medium mb-2">
            {sources.find((s) => s.id === expanded)?.fileName}
            {" · chunk "}
            {(sources.find((s) => s.id === expanded)?.chunkIndex ?? 0) + 1}
          </p>
          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-8 whitespace-pre-wrap">
            {sources.find((s) => s.id === expanded)?.content}
          </p>
        </div>
      )}
    </div>
  )
}