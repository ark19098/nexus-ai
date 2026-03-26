import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Clock, Loader2, Search, Server } from "lucide-react";
import { type Message } from "../types";
import { cn } from "@/lib/utils";

export default function AssistantContent({ message }: { message: Message }) {
  return (
    <div className="space-y-3">
      {/* RAG diagnostics — shown when metadata available */}
      {message.metadata && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2.5 border-b border-zinc-800 text-xs text-zinc-500">
          {message.metadata.rewrittenQuery && (
            <span className="flex items-center gap-1" title="Rewritten query">
              <Search className="w-3 h-3 text-zinc-600" />
              <span className="italic truncate max-w-[180px]">
                "{message.metadata.rewrittenQuery}"
              </span>
            </span>
          )}
          <span className="flex items-center gap-1" title="Chunks retrieved → used">
            <Server className="w-3 h-3 text-zinc-600" />
            {message.metadata.used}/{message.metadata.retrieved} chunks
          </span>
          <span className="flex items-center gap-1" title="Pipeline duration">
            <Clock className="w-3 h-3 text-zinc-600" />
            {message.metadata.durationMs}ms
          </span>
        </div>
      )}

      {/* Main answer */}
      {message.content.length === 0 && message.isStreaming ? (
        <span className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs">Analyzing documents...</span>
        </span>
      ) : (
        <div className={cn(
          "prose prose-invert prose-sm max-w-none",
          "prose-p:my-1 prose-li:my-0.5 prose-ul:my-1.5",
          "prose-headings:mt-3 prose-headings:mb-1",
          "prose-code:text-cyan-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded",
          "prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700",
          "prose-table:border-zinc-700 prose-th:border-zinc-700 prose-td:border-zinc-700",
          message.isError && "text-red-400"
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
          {/* Streaming cursor */}
          {message.isStreaming && message.content.length > 0 && (
            <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-0.5 animate-pulse rounded-sm align-middle" />
          )}
        </div>
      )}
    </div>
  )
}