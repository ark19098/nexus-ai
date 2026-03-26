import { MessageSquare } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-5">
        <MessageSquare className="w-7 h-7 text-zinc-600" />
      </div>
      <h2 className="text-white font-semibold text-lg mb-2">
        Ask your documents anything
      </h2>
      <p className="text-zinc-600 text-sm max-w-sm leading-relaxed">
        Upload PDFs to your workspace and ask questions. The AI answers
        using only your documents with source citations.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {[
          "Summarize the key points",
          "What are the main findings?",
          "List all mentioned dates",
        ].map((q) => (
          <span
            key={q}
            className="text-xs text-zinc-600 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-400 px-3 py-1.5 rounded-full cursor-default transition-colors"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  )
}