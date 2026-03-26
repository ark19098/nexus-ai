import { Bot, User } from "lucide-react"
import AssistantContent from "./AssistantContent"
import SourceCitations from "./SourceCitations"
import { type Message } from "../types"
import { cn } from "@/lib/utils"

export default function MessageBubble({
  message,
  userName,
}: {
  message: Message
  userName: string
}) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-7 h-7 bg-cyan-950 border border-cyan-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      )}

      <div className={cn(
        "flex flex-col gap-1.5 max-w-[82%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Role label */}
        <span className="text-zinc-600 text-xs px-1">
          {isUser ? userName : "Nexus AI"}
        </span>

        {/* Bubble */}
        <div className={cn(
          "rounded-xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-cyan-500 text-zinc-950 font-medium"
            : cn(
                "bg-zinc-900 border text-zinc-200",
                message.isError ? "border-red-800" : "border-zinc-800"
              )
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <AssistantContent message={message} />
          )}
        </div>

        {/* Source citations — shown below bubble */}
        {!isUser && message.metadata && message.metadata.sources.length > 0 && (
          <SourceCitations sources={message.metadata.sources} />
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      )}
    </div>
  )
}