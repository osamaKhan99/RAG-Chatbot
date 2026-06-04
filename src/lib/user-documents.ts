import { eq, sql } from "drizzle-orm";
import { db } from "./db-config";
import { documents } from "./db-schema";

export async function countUserDocumentChunks(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(eq(documents.userId, userId));

  return row?.count ?? 0;
}

export async function userHasDocuments(userId: string): Promise<boolean> {
  return (await countUserDocumentChunks(userId)) > 0;
}

export async function deleteUserDocuments(userId: string): Promise<void> {
  await db.delete(documents).where(eq(documents.userId, userId));
}
