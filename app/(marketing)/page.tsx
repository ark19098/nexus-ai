import Link from "next/link"
import { auth } from "@/core/auth/config"

export default async function LandingPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const dashboardUrl = session?.user?.orgId
    ? `/org/${session.user.orgId}`
    : "/onboarding"

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-400 rounded-sm rotate-12" />
            <span className="font-bold tracking-tight">Nexus AI</span>
          </div>
          <div>
            {isLoggedIn ? (
              <Link
                href={dashboardUrl}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                Go to dashboard →
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-cyan-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            Enterprise RAG — now in beta
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6 text-white">
            Your documents.
            <br />
            <span className="text-cyan-400">Answered instantly.</span>
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed mb-10">
            Upload your team&apos;s documents and let AI answer questions
            with source citations. Multi-tenant, secure, and built
            for enterprise teams.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href={isLoggedIn ? dashboardUrl : "/login"}
              className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm px-6 py-3 rounded-md transition-colors"
            >
              {isLoggedIn ? "Open dashboard" : "Get started free"}
            </Link>
            <span className="text-zinc-600 text-sm">
              No credit card required
            </span>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-24">
          {[
            {
              title: "RAG Pipeline",
              desc: "Upload PDFs and docs. AI answers questions with exact source citations.",
              icon: "📄",
            },
            {
              title: "Multi-tenant",
              desc: "Full tenant isolation. Your data never mixes with other organizations.",
              icon: "🔒",
            },
            {
              title: "Usage Analytics",
              desc: "Track token usage, costs, and query patterns per workspace.",
              icon: "📊",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-white font-semibold mb-2">{f.title}</div>
              <div className="text-zinc-500 text-sm leading-relaxed">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}