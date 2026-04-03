"use client"

// Shared shell for org-level pages that don't have a WorkspaceLayout.
// Provides: consistent top header bar (with mobile hamburger offset),
// and a scrollable content region.

interface Props {
  title:       string
  subtitle?:   string
  children:    React.ReactNode
}

export default function OrgPageShell({ title, subtitle, children }: Props) {
  return (
    <>
      {/* Top header — mirrors WorkspaceLayout header for consistent chrome */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-4 md:px-6 shrink-0 bg-zinc-950">
        {/* Spacer on mobile so the fixed hamburger (z-40, left-4) doesn't overlap */}
        <div className="w-8 md:hidden shrink-0" />
        <div className="min-w-0">
          <h1 className="text-white text-sm font-semibold truncate">{title}</h1>
          {subtitle && (
            <p className="text-zinc-600 text-xs truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </header>

      {/* Scrollable content area — fills remaining height */}
      <div className="flex-1 overflow-y-auto bg-zinc-950">
        {children}
      </div>
    </>
  )
}
