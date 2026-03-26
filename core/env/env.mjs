import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().url(),
        AUTH_SECRET: z.string(),

        GOOGLE_CLIENT_ID: z.string(),
        GOOGLE_CLIENT_SECRET: z.string(),

        S3_ENDPOINT: z.string().url(),
        S3_BUCKET_NAME: z.string(),
        S3_ACCESS_KEY_ID: z.string(),
        S3_SECRET_ACCESS_KEY: z.string(),

        INNGEST_SIGNING_KEY: z.string().min(1),
        INNGEST_EVENT_KEY: z.string().optional(),

        GROQ_API_KEY: z.string().min(1),
        GROQ_MODEL_FAST: z.string().default("llama-3.1-8b-instant"),
        GROQ_MODEL_PRO: z.string().default("llama-3.3-70b-versatile"),

        EMBEDDING_PROVIDER: z.enum(["huggingface", "openai"]).default("huggingface"),
        HUGGINGFACEHUB_API_KEY: z.string().optional(),
        HF_EMBEDDING_MODEL: z.string().default("sentence-transformers/all-MiniLM-L6-v2"),
        OPENAI_API_KEY: z.string().optional(), // Optional so the app doesn't crash when empty
        OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),

        PINECONE_API_KEY: z.string().min(1),
        PINECONE_INDEX: z.string().min(1),
        PINECONE_ENVIRONMENT: z.string().optional(),

        RETRIEVAL_K: z.string().default("20"),
        FINAL_K: z.string().default("10"),
        CHUNK_SIZE: z.string().default("1000"),
        CHUNK_OVERLAP: z.string().default("200"),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.string().url(),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

        AUTH_SECRET: process.env.AUTH_SECRET,

        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

        S3_ENDPOINT: process.env.S3_ENDPOINT,
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,

        INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
        INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,

        GROQ_API_KEY: process.env.GROQ_API_KEY,
        GROQ_MODEL_FAST: process.env.GROQ_MODEL_FAST,
        GROQ_MODEL_PRO: process.env.GROQ_MODEL_PRO,

        EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
        HUGGINGFACEHUB_API_KEY: process.env.HUGGINGFACEHUB_API_KEY,
        HF_EMBEDDING_MODEL: process.env.HF_EMBEDDING_MODEL,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,

        PINECONE_API_KEY: process.env.PINECONE_API_KEY,
        PINECONE_INDEX: process.env.PINECONE_INDEX,
        PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,

        RETRIEVAL_K: process.env.RETRIEVAL_K,
        FINAL_K: process.env.FINAL_K,
        CHUNK_SIZE: process.env.CHUNK_SIZE,
        CHUNK_OVERLAP: process.env.CHUNK_OVERLAP,
    },
  });