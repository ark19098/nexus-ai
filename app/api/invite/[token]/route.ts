// Magic link handler for org invitations
// Flow: user clicks email link → this route validates token → sets cookie → redirects to /login
// Google OAuth callback then reads the cookie to join the correct org

import { prisma } from "@/core/db/client";
import { hashInviteToken } from "@/lib/invite";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=InvalidInvite", request.url))
    }
    
    const tokenHash = hashInviteToken(token);

    const invitation = await prisma.invitation.findUnique({
        where: { tokenHash },
        include: { organization: { select: { name: true } } },
    });

    // Validate: exists + not expired + not accepted
    if (!invitation || invitation.expiresAt < new Date() || invitation.acceptedAt !== null) {
        return NextResponse.redirect(new URL("/login?error=InvalidInvite", request.url));
    }

    // Set secure httpOnly cookie with invite ID (NextAuth signIn callback reads this to join the correct org)
    const response = NextResponse.redirect(new URL("/login", request.url));

    response.cookies.set("nexus_pending_invite", invitation.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
    });

    return response;

}