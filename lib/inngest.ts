import { env } from "@/core/env/env.mjs";
import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: 'nexus-ai',
    eventKey: env.INNGEST_EVENT_KEY,
    signingKey: env.INNGEST_SIGNING_KEY
});