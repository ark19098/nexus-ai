import { auth } from "@/core/auth/config";
import { getOrganizationById } from "@/core/db/queries/organizations";
import { notFound, redirect } from "next/navigation";

export default async function OrgLayout({
  children,
  params,
  sidebar,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
  sidebar: React.ReactNode;
}) {
    const { orgId } = await params;
    const session = await auth();

    // Guard (Tenant isolation): URL Tenant must match the Session Tenant
    if (session?.user.orgId !== orgId) {
        redirect(`/org/${session?.user?.orgId}/dashboard`);
    }

    const organization = await getOrganizationById(orgId);
    if (!organization) return notFound();

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar slot — @sidebar/default.tsx renders here */}
            <aside className="w-60 border-r border-zinc-800 flex-shrink-0 flex flex-col">
                {sidebar}
            </aside>
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {children}
            </div>
        </div>
    );
}