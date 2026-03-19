import { auth } from "@/core/auth/config";
import { getWorkspaceById } from "@/core/db/queries/workspaces";
import { notFound } from "next/navigation";

export default async function WorkspaceLayout({
  children,
  params,
  sidebar,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string; wsId: string }>;
  sidebar: React.ReactNode;
}) {
  const { orgId, wsId } = await params;
  const session = await auth();
  
  // Verify this workspace actually belongs to this organization
  const workspace = await getWorkspaceById(wsId, orgId);
  if (!workspace) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar slot — @sidebar/default.tsx renders here */}
      <aside className="w-60 border-r border-zinc-800 flex-shrink-0">
        {sidebar}
      </aside>

      {/* Right side — header + main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-white text-sm font-semibold truncate">
              {workspace.name}
            </h1>
            <span className="text-zinc-700 text-xs hidden md:block">
              {workspace.id}
            </span>
          </div>

          {/* Header actions — placeholder for now */}
          <div className="flex items-center gap-2">
            <button className="text-zinc-500 hover:text-white text-xs border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors">
              + New document
            </button>
          </div>
        </header>

        {/* Main + page content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}