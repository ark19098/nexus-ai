"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createDocumentAction } from "../actions"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"

interface UploadDropzoneProps {
  workspaceId: string
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: string }
  | { status: "success"; fileName: string }
  | { status: "error"; message: string }

export function UploadDropzone({ workspaceId }: UploadDropzoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
  })
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  const handleUpload = useCallback(
    async (file: File) => {
      // Client-side validation
      if (file.type !== "application/pdf") {
        setUploadState({ status: "error", message: "Only PDF files allowed" })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadState({
          status: "error",
          message: "File must be under 10MB",
        })
        return
      }

      try {
        // STEP 1 — Get presigned URL from our API
        setUploadState({ status: "uploading", progress: "Preparing upload..." })

        const res = await fetch("/api/documents/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            fileSizeBytes: file.size,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setUploadState({
            status: "error",
            message: data.error ?? "Failed to get upload URL",
          })
          return
        }

        const { presignedUrl, fileKey } = data

        // STEP 2 — Upload directly to Cloudflare R2
        setUploadState({
          status: "uploading",
          progress: "Uploading to secure storage...",
        })

        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })

        if (!uploadRes.ok) {
          setUploadState({
            status: "error",
            message: "Failed to upload file to storage",
          })
          return
        }

        // STEP 3 — Save document record to PostgreSQL
        setUploadState({ status: "uploading", progress: "Saving document..." })

        const result = await createDocumentAction({
          fileName: file.name,
          fileKey,
          workspaceId,
        })

        if (result.error) {
          setUploadState({ status: "error", message: result.error })
          return
        }

        // Success — revalidateTag in action handles list refresh
        setUploadState({ status: "success", fileName: file.name });

        router.refresh();

        // Reset to idle after 3 seconds
        setTimeout(() => setUploadState({ status: "idle" }), 3000)
      } catch (error) {
        console.error("[UPLOAD_ERROR]", error)
        setUploadState({
          status: "error",
          message: "Something went wrong. Please try again.",
        })
      }
    },
    [workspaceId, router]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    // Reset input so same file can be re-uploaded
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const isUploading = uploadState.status === "uploading"

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-150
        ${isDragging
          ? "border-cyan-500 bg-cyan-500/5"
          : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/50"
        }
        ${isUploading ? "pointer-events-none opacity-75" : ""}
      `}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Idle state */}
      {uploadState.status === "idle" && (
        <label htmlFor="file-upload" className="cursor-pointer block">
          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-white text-sm font-medium mb-1">
            Drop a PDF here or{" "}
            <span className="text-cyan-400 hover:text-cyan-300">
              browse files
            </span>
          </p>
          <p className="text-zinc-600 text-xs">PDF only · Max 10MB</p>
        </label>
      )}

      {/* Uploading state */}
      {uploadState.status === "uploading" && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mx-auto">
            <FileText className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-zinc-300 text-sm">{uploadState.progress}</p>
        </div>
      )}

      {/* Success state */}
      {uploadState.status === "success" && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-green-950 rounded-lg flex items-center justify-center mx-auto">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Upload complete</p>
            <p className="text-zinc-500 text-xs mt-1 truncate max-w-xs">
              {uploadState.fileName}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {uploadState.status === "error" && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-red-950 rounded-lg flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-red-400 text-sm font-medium">Upload failed</p>
            <p className="text-zinc-500 text-xs mt-1">{uploadState.message}</p>
          </div>
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-cyan-400 hover:text-cyan-300 text-xs"
          >
            Try again
          </label>
        </div>
      )}
    </div>
  )
}