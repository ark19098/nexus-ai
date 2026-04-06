/**
 * TeamDoQ wordmark: solid "TeamDo" + magnifying-glass "Q" (no gradients).
 * Server-safe — no hooks required.
 */

function MagnifyingGlassQ({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="17"
        cy="17"
        r="11"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="2.6"
      />
      <circle cx="17" cy="17" r="8.2" fill="#0e7490" opacity="0.85" />
      <circle cx="20.5" cy="13" r="2.1" fill="white" opacity="0.95" />
      <line
        x1="25"
        y1="25"
        x2="33"
        y2="33"
        stroke="#a5f3fc"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Default `sm` is tuned for sidebar — large enough on desktop. */
const sizeClass = {
  sm: "text-xl leading-none",
  md: "text-2xl leading-none",
  lg: "text-4xl leading-none",
} as const

const glassClass = {
  sm: "h-8 w-8 min-h-8 min-w-8",
  md: "h-10 w-10 min-h-10 min-w-10",
  lg: "h-14 w-14 min-h-14 min-w-14",
} as const

export function TeamDoQLogo({
  className,
  size = "sm",
  variant = "default",
}: {
  className?: string
  size?: keyof typeof sizeClass
  /** `auth` — muted brand on login/onboarding so the page title stays the visual focus */
  variant?: "default" | "auth"
}) {
  if (variant === "auth") {
    return (
      <span
        className={`inline-flex items-center gap-0 font-semibold leading-none text-2xl md:text-3xl text-zinc-400 ${className ?? ""}`}
      >
        <span className="tracking-wide">TeamDo</span>
        <MagnifyingGlassQ className="h-10 w-10 min-h-10 min-w-10 shrink-0 opacity-95 md:h-12 md:w-12 md:min-h-12 md:min-w-12" />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-0 font-bold tracking-tight ${sizeClass[size]} ${className ?? ""}`}
    >
      <span className="text-white">TeamDo</span>
      <MagnifyingGlassQ
        className={`shrink-0 ${glassClass[size]}`}
      />
    </span>
  )
}
