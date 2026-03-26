import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Convert the Node Buffer to a standard Uint8Array
    const uint8Array = new Uint8Array(buffer);

    const pdf = await getDocumentProxy(uint8Array);

    // Extract text and merge all pages automatically
    const { text, totalPages } = await extractText(pdf, { mergePages: true });

    if (!text || text.trim().length === 0) {
      throw new Error("[PDF] Extraction returned empty text — file may be scanned/image-only");
    }

    console.log(`[PDF] Extracted ${text.length} chars from ${totalPages} pages.`);
    
    return text;
  } catch (error) {
    console.error("[PDF_ERROR] Failed to parse PDF with unpdf:", error);
    throw new Error("[PDF] Failed to parse document. It might be corrupted or encrypted.");
  }
}