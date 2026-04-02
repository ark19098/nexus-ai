import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { env } from "@/core/env/env.mjs"

export const s3Client = new S3Client({
  region: "auto",
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
})

export async function downloadFromR2(fileKey: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: fileKey,
  })
 
  const response = await s3Client.send(command)
 
  if (!response.Body) {
    throw new Error(`[JOB] R2 returned empty body for key: ${fileKey}`)
  }
 
  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
 
  return Buffer.concat(chunks)
}

export async function deleteFromR2(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: fileKey,
  })

  await s3Client.send(command)
  console.log(`[R2] Deleted object: ${fileKey}`)
}