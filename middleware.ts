import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./core/auth/auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/", "/login", "/register", "/test"];

export default auth((req) => {
    if (req.headers.get("x-action")) {
        return NextResponse.next()
    }
    const isLoggedIn = !!req.auth;
    const user = req.auth?.user;
    const nextUrl = req.nextUrl;
    const { pathname } = nextUrl;

    const isPublicRoute = publicRoutes.includes(pathname);
    const isOnboardingRoute = pathname.startsWith("/onboarding");
    const isApiAuthRoute = pathname.startsWith("/api/auth");
    const isStripeWebhook = pathname.startsWith("/api/stripe");
    const isWebhooks = pathname.startsWith("/api/webhooks");



    // 1. Allow public routes & API auth routes to pass through
    if (
        isPublicRoute ||
        isApiAuthRoute ||
        isOnboardingRoute ||
        isStripeWebhook ||
        isWebhooks
    ) {
        return NextResponse.next();
    }

    // 2. If not logged in, kick them to home (or a login page)
    if (!isLoggedIn || !user) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    console.log(`🛡️ [MIDDLEWARE] User ${user?.email} (Org: ${user?.orgId || "LIMBO"}) accessing -> ${pathname}`)

    // 3. THE LIMBO STATE: If logged in but no orgId, force them to onboarding
    if (isLoggedIn && !user?.orgId && !isOnboardingRoute) {
        return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
    }

    // 4. Tenant isolation — URL orgId must match session orgId
    const orgMatch = pathname.match(/\/org\/([^\/]+)/);

    if (orgMatch) {
        const urlOrgId = orgMatch[1];

        if (urlOrgId !== user?.orgId) {
            return NextResponse.redirect(new URL(`/org/${user.orgId}`, nextUrl));
        }
        return NextResponse.next();
    }

    // Prevent fully set-up users from going backwards to public/onboarding pages
    if (isPublicRoute || isOnboardingRoute) {
        return NextResponse.redirect(new URL(`/org/${user.orgId}`, nextUrl));
    }

    // GUARD 5: AI ROUTE RATE LIMITING (Placeholder)
    if (nextUrl.pathname.startsWith("/api/ai")) {
        // TODO (Sprint 2): Implement Upstash Redis Sliding Window Rate Limiting here
        // Example: await rateLimit(user.id);
    }

  return NextResponse.next();
});

// Optimize middleware so it doesn't run on static files or images
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}