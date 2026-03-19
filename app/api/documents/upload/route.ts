// presigned URL endpoint

import { NextResponse } from "next/server"
import { auth } from "@/core/auth/config"
import { s3Client } from "@/core/storage/s3"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "@/core/env/env.mjs"
import { randomUUID } from "crypto"

const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10 MB
const ALLOWED_FILE_TYPES = ["application/pdf"];

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.orgId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { fileName, contentType, fileSizeBytes  } = body;

        if (!fileName || !contentType) {
            return NextResponse.json({ error: "Missing file details" }, { status: 400 });
        }

        if (fileSizeBytes > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024} MB` }, { status: 400 });
        }

        const fileExtension = fileName.split(".").pop();
        const uniqueFileKey = `/${session.user.orgId}/${randomUUID()}.${fileExtension}`;

        if (!ALLOWED_FILE_TYPES.includes(contentType)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }

        const command = new PutObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: uniqueFileKey,
            ContentType: contentType,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return NextResponse.json({ presignedUrl, fileKey: uniqueFileKey });
    } catch (error) {
        console.error("[PRESIGN_ERROR]", error)
        return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
    
    }
}