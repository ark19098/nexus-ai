import { prisma } from "@/core/db/client";
import { env } from "@/core/env/env.mjs";
import { getPlanTokenLimit, PLANS, PlanType } from "@/lib/plans";
import { stripe } from "@/modules/billing/stripe";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import Stripe from "stripe";

const redis = Redis.fromEnv();
const IDEMPOTENCY_TTL_SECONDS = 86_400; // 1 day

export async function POST(req: Request) {
    const rawBody = await req.text();

    // Get signature from headers
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        console.error("[STRIPE WEBHOOK] Missing stripe-signature header");
        return new Response("Missing signature", { status: 400 });
    }

    // Verify Stripe signature
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

    } catch (err) {
        console.error("[STRIPE WEBHOOK] Signature verification failed:", err);
        return new Response(
            `Webhook signature error: ${err instanceof Error ? err.message : "Unknown"}`,
            { status: 400 }
        );
    }

    //Upstash idempotency check  (Stripe guarantees at-least-once delivery — same event can fire twice)
    // Redis key prevents processing the same event ID more than once
    const idempotencyKey = `stripe:event:${event.id}`;

    try {
        const alreadyProcessed = await redis.get(idempotencyKey);

        if (alreadyProcessed) {
            console.log(`[STRIPE WEBHOOK] Duplicate event skipped: ${event.id}`)
            return new Response("Already processed", { status: 200 });
        }
    } catch (redisErr) {
        console.error("[STRIPE WEBHOOK] Redis idempotency check failed:", redisErr)
    }

    // ### Process event ###
    console.log(`[STRIPE WEBHOOK] Processing: ${event.type} (${event.id})`);

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const checkoutSession = event.data.object as Stripe.Checkout.Session;

                if (!checkoutSession.subscription) {
                    console.log("[STRIPE WEBHOOK] No subscription in checkout session — skipping")
                    break;
                }

                // Retrieve full subscription to access metadata
                const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription as string);

                await handleSubscriptionUpdate(subscription);
                break;
            }
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdate(subscription);
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const orgId = subscription.metadata.organizationId;

                if (!orgId) {
                    console.error("[STRIPE WEBHOOK] No orgId in subscription metadata");
                    break;
                }

                await prisma.organization.update({
                    where: { id: orgId },
                    data: {
                        plan:                 "FREE",
                        tokenLimit:           PLANS.FREE.tokenLimit,
                        stripeSubscriptionId: null,
                        // Keep stripeCustomerId — they may resubscribe
                    },
                });

                console.log(`[STRIPE WEBHOOK] Org ${orgId} downgraded to FREE (subscription cancelled)`);
                break;
            }
            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const org = await prisma.organization.findFirst({
                    where:  { stripeCustomerId: customerId },
                    select: { id: true },
                });
 
                if (!org) {
                    console.error(`[STRIPE WEBHOOK] No org found for customer: ${customerId}`)
                    break
                }
 
                // Don't immediately downgrade — Stripe will retry. Add email notification here when Resend is set up.
                console.warn(`[STRIPE WEBHOOK] Payment failed for org ${org.id} (customer: ${customerId})`);
                break;
            }
            default: {
                console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
            }
                
        }

        // Mark event as processed in Redis with TTL
        await redis.set(idempotencyKey, "1", { ex: IDEMPOTENCY_TTL_SECONDS });

        return new Response("Webhook processed", { status: 200 });

    } catch (processingErr) {
        console.error("[STRIPE WEBHOOK] Processing error:", processingErr)
        // Return 500 — Stripe will retry the webhook
        return new Response("Webhook processing error", { status: 500 })
  }

}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const orgId = subscription.metadata.organizationId;
    const planName = subscription.metadata.plan as PlanType | undefined;

    if (!orgId) {
        console.error("[STRIPE WEBHOOK] No organizationId in subscription metadata");
        return;
    }

    if (!planName || !PLANS[planName]) {
        console.error(`[STRIPE WEBHOOK] Invalid plan name in subscription metadata: ${planName}`);
        return;
    }

    const tokenLimit = getPlanTokenLimit(planName);

    await prisma.organization.update({
        where: { id: orgId },
        data: {
            plan: planName,
            tokenLimit,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
        },
    });

    console.log(`[STRIPE WEBHOOK] Org ${orgId} updated → ${planName} (${tokenLimit.toLocaleString()} tokens)`);
}