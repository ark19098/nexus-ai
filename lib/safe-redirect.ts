/**
 * NextAuth redirectTo must stay same-origin. Reject open redirects / protocol tricks.
 */
export function sanitizePostLoginRedirect(input: string | undefined): string | null {
  if (!input?.trim()) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(input.trim());
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("://") || decoded.includes("\\")) return null;
  if (decoded === "/onboarding" || decoded.startsWith("/onboarding/")) return decoded;
  if (/^\/org\/[^/]+(\/.*)?$/.test(decoded)) return decoded;
  return null;
}
