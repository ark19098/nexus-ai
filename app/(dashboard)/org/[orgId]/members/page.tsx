// app/(dashboard)/org/[orgId]/members/page.tsx

import { auth }        from "@/core/auth/config"
import { redirect }    from "next/navigation"
import { prisma }      from "@/core/db/client"
import MembersList     from "@/modules/members/components/MembersList"
import InviteForm      from "@/modules/members/components/InviteForm"
import PendingInvites  from "@/modules/members/components/PendingInvites"
import { Role } from "@/core/db/generated"

export const dynamic = "force-dynamic"

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const session   = await auth()
  if (!session?.user) redirect("/login")

  const canManage = ["OWNER", "ADMIN"].includes(session.user.role ?? "")

  const [memberships, pendingInvites, org] = await Promise.all([
    prisma.membership.findMany({
      where:   { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    canManage
      ? prisma.invitation.findMany({
          where:   { organizationId: orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
          include: { invitedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
    prisma.organization.findUnique({
      where:  { id: orgId },
      select: { name: true },
    }),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {memberships.length} member{memberships.length !== 1 ? "s" : ""} in {org?.name}
        </p>
      </div>

      {/* Invite form — OWNER and ADMIN only */}
      {canManage && (
        <InviteForm orgId={orgId} currentUserRole={session.user.role as Role} />
      )}

      {/* Pending invites */}
      {canManage && pendingInvites.length > 0 && (
        <PendingInvites invites={pendingInvites} orgId={orgId} />
      )}

      {/* Members list */}
      <MembersList
        memberships={memberships}
        orgId={orgId}
        currentUserId={session.user.id}
        currentUserRole={session.user.role ?? "MEMBER"}
      />
    </div>
  )
}