import { auth } from "@/core/auth/config";
import { prisma } from "@/core/db/client";
import { inngest } from "@/lib/inngest";
import { checkTokenLimit } from "@/modules/observability/queries";
import { recordAiUsage } from "@/modules/observability/services";
import { runRAG } from "@/modules/rag/orchestrator";
import { HistoryMessage } from "@/modules/rag/types";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
    question: string
    conversationId?: string
    history?: HistoryMessage[]
}

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    const session = await auth();

    if (!session?.user?.id || !session?.user?.orgId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orgId, id: userId } = session.user;

    const body = await request.json().catch(() => null);

    if (!body) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const {
        question,
        conversationId,
        history = [],
    }: RequestBody = body;

    if (!question.trim()) {
        return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    if (question.length > 2000) {
        return NextResponse.json(
            { error: "Question too long — maximum 2000 characters" },
            { status: 400 }
        );
    }

    // Token limit enforcement (Check BEFORE running RAG — don't waste compute on over-limit orgs)
    const tokenStatus = await checkTokenLimit(orgId);

    if (tokenStatus.isExceeded) {
        return NextResponse.json(
        {
            error: `Monthly token limit reached (${tokenStatus.used.toLocaleString()} / ${tokenStatus.limit.toLocaleString()} tokens). Upgrade your plan to continue.`,
            code: "TOKEN_LIMIT_EXCEEDED",
        },
        { status: 429 }
        );
    }

    // Save user message to DB before running RAG so conversation history is persisted even if streaming fails
    if (conversationId) {
        await prisma.message.create({
            data: {
                conversationId,
                role: "user",
                content: question,
                sourceChunks: [],
            }
        }).catch((err) => {
            // Non-fatal — message persistence failure shouldn't block the response
            console.error("[CHAT] Failed to save user message:", err)
        });
    }

    // Run RAG pipeline
    let ragResult: Awaited<ReturnType<typeof runRAG>>;

    try {
        ragResult = await runRAG(question, orgId, history);
    } catch (err) {
        console.error("[CHAT] RAG pipeline failed:", err);

        // Record failed call for observability
        void recordAiUsage({
            orgId,
            userId,
            model:            process.env.GROQ_MODEL_PRO ?? "llama-3.3-70b-versatile",
            promptTokens:     0,
            completionTokens: 0,
            latencyMs:        Date.now() - startTime,
            error:            err instanceof Error ? err.message : "Unknown RAG error",
        });

        return NextResponse.json(
            { error: "Failed to generate response. Please try again." },
            { status: 500 }
        );

    }
    const { chunks, metadata, stream, getUsage, modelUsed } = ragResult;

    const chunkIds = chunks.map((chunk) => chunk.id);

    // console.log(
    //     `[CHAT] RAG pipeline: ${metadata.retrievedCount} retrieved → ${metadata.usedChunks} used | ${metadata.durationMs}ms`
    // );

    // Save assistant message + stream response
    const [streamForClient, streamForDB] = stream.tee();

    // ── Fire-and-forget observability ───────── (Does NOT block the streaming response)
    // getUsage() resolves when Groq emits its final usage chunk
    void (async () => {
        try {
            const { promptTokens, completionTokens } = await getUsage();

            await recordAiUsage({
                orgId,
                userId,
                model:            modelUsed,
                promptTokens,
                completionTokens,
                latencyMs:        Date.now() - startTime,
            });

            // Fire usage alert if org is approaching limit
            if (tokenStatus.isNearLimit || tokenStatus.percentUsed >= 80) {
                await inngest.send({
                    name: "org/usage-alert",
                    data: {
                        orgId,
                        percentUsed:  tokenStatus.percentUsed,
                        used:         tokenStatus.used,
                        limit:        tokenStatus.limit,
                    },
                });
            }
        } catch (err) {
            // Silent — observability must never affect user experience
            console.error("[CHAT] Fire-and-forget observability failed:", err)
        }
    })();


    // Capture full response in background for DB persistence
    if (conversationId) {
        captureAndSaveResponse(streamForDB, conversationId, chunkIds)
            .catch((err) => console.error("[CHAT] Failed to save assistant message:", err));
    }

    const sourcesPayload = chunks.map((c) => ({
        id:         c.id,
        fileName:   c.metadata.fileName,
        chunkIndex: c.metadata.chunkIndex,
        content:    c.content.slice(0, 300), // preview only
    }));

    // Stream response to client
    return new Response(streamForClient, {
        headers: {
            "Content-Type":          "text/plain; charset=utf-8",
            "Transfer-Encoding":     "chunked",
            // Pass RAG metadata to client via headers
            "X-RAG-Chunk-Ids":      JSON.stringify(chunkIds),
            "X-RAG-Sources":        encodeURIComponent(JSON.stringify(sourcesPayload)),
            "X-RAG-Retrieved":      metadata.retrievedCount.toString(),
            "X-RAG-Used":           metadata.usedChunks.toString(),
            "X-RAG-Duration-Ms":    metadata.durationMs.toString(),
            "X-RAG-Rewritten-Query": encodeURIComponent(metadata.rewrittenQuery),
        },
    });
}

async function captureAndSaveResponse(
  stream: ReadableStream<Uint8Array>,
  conversationId: string,
  sourceChunkIds: string[]
): Promise<void> {
    const decoder = new TextDecoder()
    let fullContent = ""
 
    const reader = stream.getReader()
    
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullContent += decoder.decode(value, { stream: true })
        }
    } finally {
        reader.releaseLock()
    }
 
    if (fullContent.trim().length > 0) {
        await prisma.message.create({
            data: {
                conversationId,
                role: "assistant",
                content: fullContent,
                sourceChunks: sourceChunkIds,
            },
        })
    }
}