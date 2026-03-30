// app/(dashboard)/org/[orgId]/workspace/[wsId]/chat/[conversationId]/page.tsx
// Dynamic conversation route
// Loads full message history from DB and hydrates the chat window

import { auth }     from "@/core/auth/config"
import { redirect, notFound } from "next/navigation"
import { prisma }       from "@/core/db/client"
import ChatLayout   from "@/modules/ai/components/ChatLayout"
import type { Message } from "@/modules/ai/types"
import { getConversationById, getConversationsByWorkspace } from "@/core/db/queries/conversation"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ orgId: string; wsId: string; conversationId: string }>
}) {
  const { orgId, wsId, conversationId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Load this conversation — verify it belongs to this org
  const conversation = await getConversationById(conversationId, orgId, wsId);
  if (!conversation) notFound();

  // Load all conversations for sidebar
  const conversations = await getConversationsByWorkspace(wsId, orgId);

  // Map DB messages → UI messages
  const initialMessages: Message[] = conversation.messages.map((m) => ({
    id:      m.id,
    role:    m.role as "user" | "assistant",
    content: m.content,
    // sourceChunks are chunk IDs — no metadata here, just for reference
  }))

  return (
    <ChatLayout
      orgId={orgId}
      wsId={wsId}
      userId={session.user.id}
      userName={session.user.name ?? "You"}
      conversations={conversations}
      activeConversationId={conversationId}
      initialMessages={initialMessages}
    />
  )
}