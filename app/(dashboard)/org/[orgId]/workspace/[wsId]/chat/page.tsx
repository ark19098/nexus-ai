// app/(dashboard)/org/[orgId]/workspace/[wsId]/chat/page.tsx

import { auth } from "@/core/auth/config"
import { redirect } from "next/navigation"
import Chat from "@/modules/ai/components/Chat"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ orgId: string; wsId: string }>
}) {
  const { orgId, wsId } = await params
  const session = await auth()

  if (!session?.user) redirect("/login")

  return (
    <div className="h-full flex flex-col">
      <Chat
        orgId={orgId}
        wsId={wsId}
        userName={session.user.name ?? "You"}
      />
    </div>
  )
}
