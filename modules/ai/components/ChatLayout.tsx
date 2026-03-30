"use client"

// modules/ai/components/ChatLayout.tsx
// Composes ConversationSidebar + Chat
// Handles: new conversation creation, URL updates, conversation switching

import { useState, useCallback }    from "react"
import { useRouter }                from "next/navigation"
import ConversationSidebar          from "./ConversationSidebar"
import Chat                         from "./Chat"
import { createConversationAction } from "@/modules/ai/actions"
import type { Message, ConversationSummary } from "@/modules/ai/types"

interface Props {
  orgId:                 string
  wsId:                  string
  userId:                string
  userName:              string
  conversations:         ConversationSummary[]
  activeConversationId:  string | null
  initialMessages:       Message[]
}

export default function ChatLayout({
  orgId,
  wsId,
  userId,
  userName,
  conversations:    initialConversations,
  activeConversationId: initialActiveId,
  initialMessages,
}: Props) {
  const router = useRouter()
  const [conversations, setConversations]     = useState(initialConversations)
  const [activeId, setActiveId]               = useState(initialActiveId)
  const [messages, setMessages]               = useState(initialMessages)
  const [pendingConversationId, setPendingId] = useState<string | null>(null)

  // Called by Chat when user sends first message and no conversationId exists yet
  // Creates the conversation, updates URL silently, returns the new ID
  const handleCreateConversation = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      const result = await createConversationAction(wsId, orgId, firstMessage);
      if (result.error || !result.conversationId) return null;

      const newId = result.conversationId;

      // Add to sidebar immediately (optimistic)
      setConversations((prev) => [
        {
          id:        newId,
          title:     firstMessage.slice(0, 60),
          createdAt: new Date(),
          messages:  [{ content: firstMessage }],
        },
        ...prev,
      ]);

      setActiveId(newId);

      // Update URL silently — no page reload, no scroll reset
      router.replace(
        `/org/${orgId}/workspace/${wsId}/chat/${newId}`,
        { scroll: false }
      );

      return newId;
    },
    [orgId, wsId, router]
  )

  // Called when user clicks a conversation in the sidebar
  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      if (conversationId === activeId) return
      // Navigate to conversation — page will SSR with full history
      router.push(`/org/${orgId}/workspace/${wsId}/chat/${conversationId}`)
    },
    [activeId, orgId, wsId, router]
  )

  // Called when user clicks "New Chat"
  const handleNewChat = useCallback(() => {
    setActiveId(null)
    setMessages([])
    router.push(`/org/${orgId}/workspace/${wsId}/chat`)
  }, [orgId, wsId, router])

  // Called when user deletes a conversation from sidebar
  const handleDeleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))

      // If deleting active conversation — go to new chat
      if (conversationId === activeId) {
        handleNewChat()
      }
    },
    [activeId, handleNewChat]
  )

  return (
    <div className="flex h-full">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        orgId={orgId}
        wsId={wsId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
      />

      <div className="flex-1 min-w-0">
        <Chat
          orgId={orgId}
          wsId={wsId}
          userName={userName}
          conversationId={activeId ?? undefined}
          initialMessages={messages}
          onCreateConversation={handleCreateConversation}
        />
      </div>
    </div>
  )
}