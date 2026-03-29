import { calculateCost } from "./costs";
import { prisma } from "@/core/db/client";

interface RecordUsageParams {
  orgId:            string
  userId:           string
  model:            string
  promptTokens:     number
  completionTokens: number
  latencyMs:        number
  error?:           string
}

export async function recordAiUsage(params: RecordUsageParams): Promise<void> {
    const { orgId, userId, model, promptTokens, completionTokens, latencyMs, error } = params;

    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost(model, promptTokens, completionTokens);

    try {
        await prisma.aiUsage.create({
            data: {
                organizationId:  orgId,
                userId,
                model,
                promptTokens,
                completionTokens,
                totalTokens,
                cost,
                latencyMs,
                error: error ?? null,
            }
        });

        console.log(`[OBSERVABILITY] ${model} | ${totalTokens} tokens | $${cost.toFixed(6)} | ${latencyMs}ms | org:${orgId}`);
    } catch (err) {
        console.error("[OBSERVABILITY] Failed to record AI usage:", err);
    }


}