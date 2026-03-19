import { auth } from "@/core/auth/config";
import { getOrganizationById } from "@/core/db/queries/organizations";
import { notFound, redirect } from "next/navigation";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;
    const session = await auth();

    // Guard (Tenant isolation): URL Tenant must match the Session Tenant
    if (session?.user.orgId !== orgId) {
        redirect(`/org/${session?.user?.orgId}/dashboard`);
    }

    const organization = await getOrganizationById(orgId);

    // If the org doesn't exist in the database, trigger Next.js 404
    if (!organization) {
        return notFound();
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Placeholder for your future Sidebar */}
            <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex">
                <div className="p-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-800 truncate">{organization.name}</h2>
                <p className="text-xs text-slate-500 capitalize">{session.user.role}</p>
                </div>
                <nav className="p-4 flex-1">
                {/* Nav links go here later */}
                <div className="text-sm text-slate-400">Sidebar Placeholder</div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
                {children}
            </main>
        </div>
    );
}