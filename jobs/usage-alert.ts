import { prisma } from "@/core/db/client";
import { inngest } from "@/lib/inngest";

export const usageAlert = inngest.createFunction(
    {
        id: "usage-alert",
        name: "Usage Limit Alert",
        retries: 2,
        triggers: [{ event: "org/usage-alert" }]
    },
    async ({ event }) => {
        const { orgId, percentUsed, used, limit } = event.data;

        console.log(
            `[USAGE-ALERT] Org ${orgId} at ${percentUsed.toFixed(1)}% (${used.toLocaleString()}/${limit.toLocaleString()} tokens)`
        );

        // Get org owner for notification
        const ownerMembership = await prisma.membership.findFirst({
            where:   { organizationId: orgId, role: "OWNER" },
            include: { user: { select: { email: true, name: true } }, organization: true },
        });

        if (!ownerMembership) {
            console.warn(`[USAGE-ALERT] No owner found for org ${orgId}`);
            return;
        }

        const { user, organization } = ownerMembership;
        const isExceeded = percentUsed >= 100;

        // TODO: Wire up email provider (Resend recommended)
        // For now — log the alert. Replace with actual email send.
        console.log(`[USAGE-ALERT] Would send email to ${user.email}:`)
        console.log(`  Org: ${organization.name}`)
        console.log(`  Usage: ${percentUsed.toFixed(1)}% of monthly limit`)
        console.log(`  Tokens: ${used.toLocaleString()} / ${limit.toLocaleString()}`)
        console.log(`  Status: ${isExceeded ? "EXCEEDED" : "NEAR LIMIT"}`)
    
        // Example Resend integration (uncomment when ready):
        // await resend.emails.send({
        //   from:    "Nexus AI <alerts@nexus.ai>",
        //   to:      user.email,
        //   subject: isExceeded
        //     ? `[Nexus AI] Token limit reached — ${organization.name}`
        //     : `[Nexus AI] You've used ${percentUsed.toFixed(0)}% of your monthly tokens`,
        //   html: buildAlertEmail({ user, organization, percentUsed, used, limit }),
        // })
    
        return {
            orgId,
            notified: user.email,
            percentUsed,
        }
    }
);