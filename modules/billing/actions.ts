"use server"

import { auth } from "@/core/auth/config";
import { prisma } from "@/core/db/client";
import { PLANS, PlanType } from "@/lib/plans";
import { redirect } from "next/navigation";
import { stripe } from "./stripe";
import { env } from "@/core/env/env.mjs";

export async function createCheckoutSessionAction(plan: PlanType) {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.orgId) {
        redirect("/login");
    }

    if (session.user.role !== "OWNER") {
        return { error: "Only the organization owner can manage billing" };
    }

    const { orgId } = session.user;
    const selectedPlan = PLANS[plan];

    if (!selectedPlan.priceId) {
        return { error: "Invalid plan selected" };
    }

    // Get or create Stripe customer
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { stripeCustomerId: true, name: true },
    });

    let customerId = org?.stripeCustomerId;

    if (!customerId) {
        const customer = await stripe.customers.create({
            name: org?.name,
            metadata: { organizationId: orgId },
        });
        customerId = customer.id;

        // Persist customer ID immediately — don't wait for webhook
        await prisma.organization.update({
            where: { id: orgId },
            data:  { stripeCustomerId: customerId },
        });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
            { price: selectedPlan.priceId, quantity: 1 },
        ],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/org/${orgId}/billing?success=true`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/org/${orgId}/billing?canceled=true`,
        subscription_data: {
            metadata: {
                organizationId: orgId,
                plan,
            },
        },
        metadata: {
            organizationId: orgId,
            plan,
        },
    });

    return { url: checkoutSession.url };

}
// Attach orgId to the SUBSCRIPTION (not just the session)
// This persists to all future subscription webhooks (renewals, updates)
// Also attach orgId to session (directly root of object) for checkout.session.completed


// ── Create Stripe Customer Portal Session ─────────────────────────────────────
 
export async function createPortalSessionAction() {
  const session = await auth()
 
  if (!session?.user?.id || !session.user.orgId) {
    redirect("/login")
  }
 
  if (session.user.role !== "OWNER") {
    return { error: "Only the organization owner can manage billing" }
  }
 
  const { orgId } = session.user
 
  const org = await prisma.organization.findUnique({
    where:  { id: orgId },
    select: { stripeCustomerId: true },
  })
 
  if (!org?.stripeCustomerId) {
    return { error: "No billing account found. Please subscribe first." }
  }
 
  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   org.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/org/${orgId}/billing`,
  })
 
  return { url: portalSession.url }
}