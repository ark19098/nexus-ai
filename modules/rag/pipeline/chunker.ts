// modules/rag/chunker.ts

export function chunkBySlidingWindow(
  text: string,
  maxSize: number,
  overlap: number
): string[] {
  // Soft normalization: collapse spaces, but preserve up to double newlines
  const cleanText = text.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  
  if (cleanText.length <= maxSize) return [cleanText];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleanText.length) {
    let end = start + maxSize;

    // Snap to the nearest word boundary if not at the end of the text
    if (end < cleanText.length) {
      const lastSpace = cleanText.lastIndexOf(" ", end);
      if (lastSpace > start + overlap) {
        end = lastSpace;
      }
    }

    chunks.push(cleanText.slice(start, end).trim());

    // Move forward, minus the overlap
    const step = end - start - overlap;
    if (step <= 0) break; // Safety break
    
    start += step;
  }

  return chunks;
}

// Paragraph-aware chunking
export function chunkByParagraph(
  text: string,
  maxSize: number,
  overlap: number
): string[] {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    // THE FIX: If a single paragraph is massively oversized (like a PDF), 
    // immediately slice it up using the sliding window.
    if (para.length > maxSize) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      const subChunks = chunkBySlidingWindow(para, maxSize, overlap);
      chunks.push(...subChunks);
      continue;
    }

    const candidate = current ? `${current}\n\n${para}` : para;

    if (candidate.length > maxSize && current.length > 0) {
      chunks.push(current.trim());
      const overlapText = current.length > overlap ? current.slice(-overlap) : current;
      current = `${overlapText}\n\n${para}`;
    } else {
      current = candidate;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks;
}

// Primary Chunkers
export function chunkPlainText(
  text: string,
  maxSize = 1000,
  overlap = 200
): string[] {
  if (text.length <= maxSize) {
    const trimmed = text.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  return chunkByParagraph(text, maxSize, overlap);
}

export function chunkMarkdown(
  text: string,
  maxSize = 1000,
  overlap = 200
): string[] {
  const sections = text
    .replace(/\r\n/g, "\n")
    .split(/(?=^#{1,3}\s)/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sections.length === 0) {
    return chunkPlainText(text, maxSize, overlap);
  }

  const chunks: string[] = [];

  for (const section of sections) {
    if (section.length <= maxSize) {
      chunks.push(section);
    } else {
      const subChunks = chunkByParagraph(section, maxSize, overlap);
      chunks.push(...subChunks);
    }
  }

  return chunks.filter((c) => c.trim().length > 0);
}

// Stats helper
export function chunkStats(chunks: string[]): {
  count: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
} {
  if (chunks.length === 0) {
    return { count: 0, avgLength: 0, minLength: 0, maxLength: 0 };
  }

  const lengths = chunks.map((c) => c.length);
  return {
    count: chunks.length,
    avgLength: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
  };
}


// Pure text chunking functions — zero I/O, zero API calls, zero side effects

// Sliding Window Chunker (The Safety Net)

/**
 * Ruthlessly slices text by character count to guarantee it never exceeds maxSize.
 * Snaps to the nearest space so it doesn't cut words in half.
 * Preserves structural newlines for better LLM readability.
 */