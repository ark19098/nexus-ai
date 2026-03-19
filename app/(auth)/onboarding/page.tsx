import { redirect } from "next/navigation"
import { auth } from "@/core/auth/config"
import OnboardingForm from "./_components/OnboardingForm"

export default async function OnboardingPage() {
  const session = await auth()

  // Already has org — shouldn't be here
  if (session?.user?.orgId) {
    redirect(`/org/${session.user.orgId}`)
  }

  // Not logged in at all
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-cyan-400 rounded-sm rotate-12" />
            <span className="text-white text-xl font-bold tracking-tight">
              Nexus AI
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Set up your workspace
          </h1>
          <p className="text-zinc-500 text-sm">
            You are signed in as{" "}
            <span className="text-zinc-300">{session.user.email}</span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <OnboardingForm />
        </div>
      </div>
    </div>
  )
}