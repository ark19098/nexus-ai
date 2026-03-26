import { prisma } from "@/core/db/client";
import { env } from "@/core/env/env.mjs";
import { downloadFromR2 } from "@/core/storage/s3";
import { inngest } from "@/lib/inngest";
import { embedTexts } from "@/modules/rag/client/embeddings";
import { deleteDocumentChunks, upsertChunks } from "@/modules/rag/client/pinecone";
import { extractPdfText } from "@/modules/rag/pdf";
import { chunkPlainText, chunkStats } from "@/modules/rag/pipeline/chunker";
import { ChunkForUpsert, VectorizationInput } from "@/modules/rag/types";

const CHUNK_SIZE = env.CHUNK_SIZE ? parseInt(env.CHUNK_SIZE) : 1000;
const CHUNK_OVERLAP = env.CHUNK_OVERLAP ? parseInt(env.CHUNK_OVERLAP) : 200;

export const vectorizeDocument = inngest.createFunction({
        id: "vectorize-document",
        retries: 2,
        timeouts: { finish: "5m" },
        triggers: [{ event: "document/process" }]
    },
    async ({ event, step }) => {
        const { documentId, orgId, workspaceId, fileName } = event.data as VectorizationInput;

        console.log(
            `[JOB] Starting vectorization for document ${documentId} (org: ${orgId})`
        )

        // STEP 1: Fetch document record from Prisma
        const document = await step.run("fetch-document-record", async () => {
            const doc = await prisma.document.findFirst({
                where: {
                    id: documentId,
                    organizationId: orgId,
                    deletedAt: null,
                }
            });

            if (!doc) {
                throw new Error(
                `[JOB] Document ${documentId} not found for org ${orgId}`
                );
            }

            await prisma.document.update({
                where: { id: doc.id },
                data: { status: "PROCESSING" }
            });

            return doc;
        });
        console.log(`[JOB] Fetched document ${document}`);

        // STEP 2: Download PDF from R2 & Extract Text
        const extractedText = await step.run("download-and-extract-pdf", async () => {
            const pdfBuffer = await downloadFromR2(document.fileUrl);
            
            return await extractPdfText(pdfBuffer);
        });
        console.log(`[JOB] Successfully extracted ${extractedText.length} characters of text.`);

        // STEP 3: Chunk the extracted text
        const chunks = await step.run("chunk-text", async () => {
            const textChunks = chunkPlainText(extractedText, CHUNK_SIZE, CHUNK_OVERLAP);
            const stats = chunkStats(textChunks);

            console.log(`[JOB] Chunked into ${stats.count} chunks | avg: ${stats.avgLength} chars | min: ${stats.minLength} | max: ${stats.maxLength}`)
        
            if (textChunks.length === 0) {
                throw new Error("[JOB] Chunking produced 0 chunks — aborting")
            }

            return textChunks;
        });
        console.log(`[JOB] Chunked text [JOB] ${chunks}`);

        // STEP 4: Embed each chunk
        const embeddings = await step.run("embed-chunks", async () => {
            console.log(`[JOB] Embedding ${chunks.length} chunks...`)
            const vecs = await embedTexts(chunks);
            console.log(`[JOB] Generated ${vecs.length} embeddings`)

            return vecs;
        });
        console.log(`[JOB] Generated Embeddings ${embeddings}`);

        // STEP 5: Delete existing vectors (re-processing case)
        await step.run("delete-existing-vectors", async () => {
            await deleteDocumentChunks(documentId, orgId)
        });

        // STEP 6: Upsert vectors to Pinecone
        await step.run("upsert-to-pinecone", async () => {
            const chunksForUpsert: ChunkForUpsert[] = chunks.map((content, index) => ({
                // ID format: orgId_documentId_chunkIndex — human readable + unique
                id: `${orgId}_${documentId}_${index}`,
                content,
                embedding: embeddings[index]!,
                metadata: {
                orgId:       orgId,
                documentId:  documentId,
                workspaceId: workspaceId,
                fileName:    fileName,
                chunkIndex:  index,
                totalChunks: chunks.length,
                },
            }))
        
            await upsertChunks(chunksForUpsert);
            console.log(`[JOB] Upserted ${chunksForUpsert.length} vectors to Pinecone`)
        });
      
        // STEP 7: Mark document as READY
        await step.run("mark-document-ready", async () => {
            await prisma.document.update({
                where: { id: documentId },
                data: {
                status:     "READY",
                vectorized: true,
                },
            })
            console.log(`[JOB] Document ${documentId} marked as READY`)
        });

        return {
            documentId:  documentId,
            orgId,
            chunksCount: chunks.length,
            status:      "READY",
        }
    }
);

export const vectorizeDocumentFailure = inngest.createFunction({
        id: "vectorize-document-failure",
        name: "Handle Vectorization Failure",
        triggers: [{ event: "inngest/function.failed" }]
    },
    async ({ event }) => {
        // Only handle failures from our vectorize function
        if (event.data.function_id !== "nexus-ai-vectorize-document") return;

        const originalData = event.data.event.data as VectorizationInput;

        console.error(
            `[JOB] Vectorization permanently failed for document ${originalData.documentId}:`,
            event.data.error
        );

        await prisma.document.update({
            where: { id: originalData.documentId },
            data:  { status: "FAILED" },
        });
    }
);