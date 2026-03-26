import { auth } from "@/core/auth/config";
import { prisma } from "@/core/db/client";
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
    try {
        const session = await auth();

        if (!session?.user?.id || !session?.user?.orgId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { orgId, id: userId } = session.user;

        const body = await request.json();
        const {
            question,
            conversationId,
            history = [],
        }: RequestBody = body;

        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 })
        }

        if (question.length > 2000) {
            return NextResponse.json(
                { error: "Question too long — maximum 2000 characters" },
                { status: 400 }
            );
        }

        // Save user message to DB
        // Save before running RAG so conversation history is persisted even if streaming fails
        if (conversationId) {
            await prisma.message.create({
                data: {
                    conversationId,
                    role: "user",
                    content: question,
                    sourceChunks: [],
                }
            });
        }

        // Run RAG pipeline
        const { chunks, metadata, stream } = await runRAG(question, orgId, history);

        const chunkIds = chunks.map((chunk) => chunk.id);

        console.log(
            `[CHAT] RAG pipeline: ${metadata.retrievedCount} retrieved → ${metadata.usedChunks} used | ${metadata.durationMs}ms`
        );

        // Save assistant message + stream response
        const [streamForClient, streamForDB] = stream.tee();
        

        // Capture full response in background for DB persistence
        if (conversationId) {
            captureAndSaveResponse(streamForDB, conversationId, chunkIds)
                .catch((err) => console.error("[CHAT] Failed to save assistant message:", err));
        }

        // Build streaming response
        const chunkSources = chunks.map((c) => ({
            id:         c.id,
            fileName:   c.metadata.fileName,
            chunkIndex: c.metadata.chunkIndex,
            content:    c.content.slice(0, 300), // preview only
        }));

        return new Response(streamForClient, {
            headers: {
                "Content-Type":          "text/plain; charset=utf-8",
                "Transfer-Encoding":     "chunked",
                // Pass RAG metadata to client via headers
                "X-RAG-Chunk-Ids":      JSON.stringify(chunkIds),
                "X-RAG-Sources":        encodeURIComponent(JSON.stringify(chunkSources)),
                "X-RAG-Retrieved":      metadata.retrievedCount.toString(),
                "X-RAG-Used":           metadata.usedChunks.toString(),
                "X-RAG-Duration-Ms":    metadata.durationMs.toString(),
                "X-RAG-Rewritten-Query": encodeURIComponent(metadata.rewrittenQuery),
            },
        });

    } catch (error) {
        console.error("[CHAT] RAG pipeline error:", error);
 
        return NextResponse.json(
            { error: "Failed to generate response. Please try again." },
            { status: 500 }
        );
    }
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