import { redirect } from "next/navigation"
import { auth, signIn } from "@/core/auth/config"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user?.orgId) {
    redirect(`/org/${session.user.orgId}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-cyan-400 rounded-sm rotate-16" />
            <span className="text-white text-2xl font-bold tracking-tight">
              Nexus AI
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-zinc-500 text-md">
            Sign in to your workspace
          </p>
        </div>

        {/* Sign in form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/onboarding" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-md py-2.5 px-4 rounded-md transition-colors duration-150"
            >
              {/* Google SVG icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="text-zinc-600 text-sm text-center mt-4">
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}