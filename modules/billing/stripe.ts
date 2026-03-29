import { env } from "@/core/env/env.mjs";
import Stripe from "stripe"

export const stripe = new Stripe(env.STRIPE_SECRET_KEY!);