// src/lib/embeddings.ts
import { embed, embedMany } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";

const embeddingModel = openrouter.textEmbeddingModel(
  "openai/text-embedding-3-small"
);

/** OpenAI-compatible APIs allow at most 2048 inputs per embeddings request */
const EMBED_BATCH_SIZE = 512;

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.replaceAll("\n", " ");

  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const inputs = texts.map((text) => text.replaceAll("\n", " "));
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < inputs.length; i += EMBED_BATCH_SIZE) {
    const batch = inputs.slice(i, i + EMBED_BATCH_SIZE);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch,
    });
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}
