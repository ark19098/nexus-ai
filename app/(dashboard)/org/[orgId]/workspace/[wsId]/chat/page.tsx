import { auth } from "@/core/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/core/db/client";
import ChatLayout from "@/modules/ai/components/ChatLayout";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ orgId: string; wsId: string }>
}) {
  const { orgId, wsId } = await params;
  const session = await auth();

  if (!session?.user) redirect("/login");

  // Load all conversations for sidebar
  const conversations = await prisma.conversation.findMany({
    where: { organizationId: orgId, workspaceId: wsId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
    },
  });

  return (
    <ChatLayout
      orgId={orgId}
      wsId={wsId}
      userId={session.user.id}
      userName={session.user.name ?? "You"}
      conversations={conversations}
      activeConversationId={null}
      initialMessages={[]}
    />
  )
}
