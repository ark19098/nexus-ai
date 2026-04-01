import { env } from "@/core/env/env.mjs";

export const PLANS = {
    FREE: {
        name:        "Free",
        description: "Get started with AI document search",
        priceLabel:  "$0 / month",
        priceId:     null,
        tokenLimit:  100_000,
        features: [
            "100,000 tokens / month",
            "Up to 10 documents",
            "1 workspace",
            "Community support",
        ],
    },
    PRO: {
        name:        "Pro",
        description: "For growing teams with heavy usage",
        priceLabel:  "$9 / month",
        priceId:     env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO ?? null,
        tokenLimit:  1_000_000,
        features: [
            "1,000,000 tokens / month",
            "Unlimited documents",
            "Multiple workspaces",
            "Priority support",
            "Usage analytics",
        ],
    },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanTokenLimit(plan: PlanType): number {
    return PLANS[plan]?.tokenLimit ?? PLANS.FREE.tokenLimit;
}

export function isUpgrade(from: PlanType, to: PlanType): boolean {
    const order: PlanType[] = ["FREE", "PRO"];
    return order.indexOf(from) < order.indexOf(to);
}