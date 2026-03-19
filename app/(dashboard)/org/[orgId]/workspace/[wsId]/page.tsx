import { auth } from "@/core/auth/config"

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ orgId: string; wsId: string }>
}) {
  const { wsId } = await params
  const session = await auth()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-white text-xl font-bold mb-1">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-zinc-500 text-sm">
          Workspace ID: {wsId}
        </p>
      </div>

      {/* Placeholder stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Documents", value: "0", sub: "Upload your first PDF" },
          { label: "Conversations", value: "0", sub: "Start chatting" },
          { label: "Tokens used", value: "0", sub: "This month" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
          >
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p className="text-white text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-zinc-600 text-xs">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}