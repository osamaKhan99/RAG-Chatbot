// src/app/upload/actions.ts
"use server";

import pdf from "pdf-parse";
import { db } from "@/lib/db-config";
import { documents } from "@/lib/db-schema";
import { generateEmbeddings } from "@/lib/embeddings";
import { chunkContent } from "@/lib/chunking";
import { requireUserId } from "@/lib/auth";
import { deleteUserDocuments } from "@/lib/user-documents";

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB
/** Stay under OpenRouter/OpenAI embed batch limit (2048) with headroom */
const MAX_CHUNKS = 2000;

export async function processPdfFile(formData: FormData) {
  try {
    const userId = await requireUserId();
    const file = formData.get("pdf") as File | null;

    if (!file || file.size === 0) {
      return { success: false, error: "No PDF file provided" };
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are allowed" };
    }

    if (file.size > MAX_PDF_BYTES) {
      return {
        success: false,
        error: "PDF must be 5 MB or smaller",
      };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return {
        success: false,
        error: "No text found in PDF",
      };
    }

    const chunks = await chunkContent(data.text);

    if (chunks.length > MAX_CHUNKS) {
      return {
        success: false,
        error: `PDF is too long (${chunks.length} sections). Use a shorter document or split it (max ${MAX_CHUNKS} sections).`,
      };
    }

    const embeddings = await generateEmbeddings(chunks);

    await deleteUserDocuments(userId);

    const records = chunks.map((chunk, index) => ({
      userId,
      content: chunk,
      embedding: embeddings[index],
    }));

    await db.insert(documents).values(records);

    return {
      success: true,
      message: `Uploaded "${file.name}" — ${records.length} searchable chunks ready for chat`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "Sign in required to upload documents" };
    }
    if (
      error instanceof Error &&
      (error.message.includes("Body exceeded") ||
        error.message.includes("bodysizelimit"))
    ) {
      return {
        success: false,
        error: `PDF is too large for the server (max ${MAX_PDF_BYTES / (1024 * 1024)} MB). Restart the dev server after config changes.`,
      };
    }
    if (
      error instanceof Error &&
      error.message.includes("relation") &&
      error.message.includes("does not exist")
    ) {
      return {
        success: false,
        error:
          "Database tables missing. Run: npx drizzle-kit migrate",
      };
    }
    if (
      error instanceof Error &&
      (error.message.includes("2048") ||
        error.message.includes("array length"))
    ) {
      return {
        success: false,
        error:
          "PDF produced too many text sections for embedding. Try a shorter document.",
      };
    }
    console.error("PDF processing error:", error);
    return {
      success: false,
      error: "Failed to process PDF",
    };
  }
}
