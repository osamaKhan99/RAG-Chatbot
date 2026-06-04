// src/lib/chunking.ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/** Larger chunks = fewer embedding API calls and better context per hit */
export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
  separators: ["\n\n", "\n", " "],
});

export async function chunkContent(content: string) {
  return await textSplitter.splitText(content.trim());
}
