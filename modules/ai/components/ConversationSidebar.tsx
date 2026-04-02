"use client"

// modules/ai/components/ConversationSidebar.tsx

import { useState, useTransition }   from "react"
import { Plus, MessageSquare, Trash2, Loader2, X } from "lucide-react"
import { deleteConversationAction }  from "@/modules/ai/actions"
import type { ConversationSummary }  from "@/modules/ai/types"

interface Props {
  conversations: ConversationSummary[]
  activeId:      string | null
  orgId:         string
  wsId:          string
  isOpen:        boolean
  onClose:       () => void
  onSelect:      (id: string) => void
  onNew:         () => void
  onDelete:      (id: string) => void
}

export default function ConversationSidebar({
  conversations,
  activeId,
  orgId,
  isOpen,
  onClose,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 shrink-0 flex items-center gap-2">
        <button
          onClick={onNew}
          className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          New conversation
        </button>
        {/* Close button — mobile only */}
        <button
          className="md:hidden p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
          onClick={onClose}
          aria-label="Close conversations"
        >
          <X className="w-4 h-4" />
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

  return (
    <>
      {/* ── Desktop: static sidebar ── */}
      <div className="hidden md:flex w-56 border-r border-zinc-800 shrink-0 h-full">
        {sidebarContent}
      </div>

      {/* ── Mobile: slide-in drawer ── */}
      <div className="md:hidden">
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
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
    e.stopPropagation()
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
      <MessageSquare className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? "text-cyan-400" : "text-zinc-600"}`} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-tight">{title}</p>
        <p className="text-xs text-zinc-600 truncate mt-0.5 leading-tight">{preview}</p>
      </div>

      {/* Delete button — visible on hover or active */}
      {(hovered || isActive) && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="shrink-0 p-0.5 rounded hover:bg-zinc-700 text-zinc-600 hover:text-red-400 transition-colors"
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
