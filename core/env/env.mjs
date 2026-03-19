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
        
        OPENAI_API_KEY: z.string(),

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

        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  });