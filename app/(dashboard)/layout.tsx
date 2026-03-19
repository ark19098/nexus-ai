import { redirect } from "next/navigation"
import { auth } from "@/core/auth/config"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const session = await auth();

    console.log("[UI: DASHBOARD] Layout loaded for:", session?.user?.email);
    console.log("[UI: DASHBOARD] Full Session Object:", JSON.stringify(session, null, 2));

    if (!session?.user) {
        redirect("/login");
    }

    return <>{children}</>
}