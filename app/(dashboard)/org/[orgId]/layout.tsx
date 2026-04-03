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
        <div className="h-screen bg-zinc-950 flex overflow-hidden">
            {/* Sidebar — always visible on md+, hidden on mobile.
                The Sidebar component itself renders the mobile drawer + hamburger. */}
            <aside className="hidden md:flex w-60 border-r border-zinc-800 shrink-0 flex-col">
                {sidebar}
            </aside>

            {/* Mobile: sidebar renders as an overlay drawer outside the flow */}
            <div className="md:hidden">
                {sidebar}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
