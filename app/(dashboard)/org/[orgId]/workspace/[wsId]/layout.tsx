import { auth } from "@/core/auth/config";
import { getWorkspaceById } from "@/core/db/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string; wsId: string }>;
}) {
  const { orgId, wsId } = await params;
  
  // Verify this workspace actually belongs to this organization
  const workspace = await getWorkspaceById(wsId, orgId);
  if (!workspace) notFound();

  return (
    <>
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-sm font-semibold truncate">
            {workspace.name}
          </h1>
          <span className="text-zinc-700 text-xs hidden md:block">
            {workspace.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/org/${orgId}/workspace/${wsId}/documents`} passHref
            className="text-zinc-500 hover:text-white text-xs border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors"
          >
              + New document
          </Link>
        </div>
      </header>
      <div className="flex-1 overflow-auto bg-zinc-950">
        {children}
      </div>
    </>
  );
}