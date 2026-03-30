"use client"

// modules/ai/components/ConversationSidebar.tsx

import { useState, useTransition }   from "react"
import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react"
import { deleteConversationAction }  from "@/modules/ai/actions"
import type { ConversationSummary }  from "@/modules/ai/types"

interface Props {
  conversations: ConversationSummary[]
  activeId:      string | null
  orgId:         string
  wsId:          string
  onSelect:      (id: string) => void
  onNew:         () => void
  onDelete:      (id: string) => void
}

export default function ConversationSidebar({
  conversations,
  activeId,
  orgId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <div className="w-56 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-zinc-950 h-full">
      {/* New chat button */}
      <div className="p-3 border-b border-zinc-800 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New conversation
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-zinc-700 text-xs text-center py-8 px-3 leading-relaxed">
            No conversations yet.
            <br />
            Ask your first question.
          </p>
        )}

        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeId}
            orgId={orgId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

// ── Conversation item with hover-reveal delete ────────────────────────────────

function ConversationItem({
  conversation,
  isActive,
  orgId,
  onSelect,
  onDelete,
}: {
  conversation: ConversationSummary
  isActive:     boolean
  orgId:        string
  onSelect:     (id: string) => void
  onDelete:     (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [hovered, setHovered]        = useState(false)

  const preview = conversation.messages[0]?.content?.slice(0, 55) ?? "New conversation"
  const title   = conversation.title ?? preview

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation() // don't trigger onSelect
    startTransition(async () => {
      const result = await deleteConversationAction(conversation.id, orgId)
      if (!result.error) {
        onDelete(conversation.id)
      }
    })
  }

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group w-full text-left px-2.5 py-2 rounded-lg transition-colors cursor-pointer
        flex items-start gap-2
        ${isActive
          ? "bg-zinc-800 text-white"
          : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300"
        }
      `}
    >
      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isActive ? "text-cyan-400" : "text-zinc-600"}`} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-tight">{title}</p>
        <p className="text-xs text-zinc-600 truncate mt-0.5 leading-tight">{preview}</p>
      </div>

      {/* Delete button — visible on hover */}
      {(hovered || isActive) && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex-shrink-0 p-0.5 rounded hover:bg-zinc-700 text-zinc-600 hover:text-red-400 transition-colors"
          title="Delete conversation"
        >
          {isPending
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Trash2 className="w-3 h-3" />
          }
        </button>
      )}
    </div>
  )
}