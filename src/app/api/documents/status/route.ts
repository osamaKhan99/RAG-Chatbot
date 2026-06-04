import { auth } from "@clerk/nextjs/server";
import { countUserDocumentChunks } from "@/lib/user-documents";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json(
      { authenticated: false, hasDocuments: false, chunkCount: 0 },
      { status: 401 }
    );
  }

  try {
    const chunkCount = await countUserDocumentChunks(userId);

    return Response.json({
      authenticated: true,
      hasDocuments: chunkCount > 0,
      chunkCount,
    });
  } catch (error) {
    console.error("Document status error:", error);
    const message =
      error instanceof Error && error.message.includes("does not exist")
        ? "Database not ready. Run migrations: npx drizzle-kit migrate"
        : "Unable to check document status";

    return Response.json(
      {
        authenticated: true,
        hasDocuments: false,
        chunkCount: 0,
        error: message,
      },
      { status: 503 }
    );
  }
}
