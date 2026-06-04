// src/app/api/chat/route.ts
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  InferUITools,
  UIDataTypes,
  stepCountIs,
} from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { searchDocuments } from "@/lib/search";
import {
  getLastUserMessageText,
  NO_CONTEXT_REFUSAL,
  RAG_SYSTEM_PROMPT,
} from "@/lib/rag-guardrails";
import { userHasDocuments } from "@/lib/user-documents";

const SEARCH_THRESHOLD = 0.45;
const MIN_QUERY_LENGTH = 2;

function createSearchTool(userId: string) {
  return {
    searchKnowledgeBase: tool({
      description:
        "Search the user's uploaded PDF chunks. Required before every answer. Only returns content from this user's document.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Search query derived from the user's question"),
      }),
      execute: async ({ query }) => {
        try {
          const results = await searchDocuments(
            userId,
            query,
            5,
            SEARCH_THRESHOLD
          );

          if (results.length === 0) {
            return `NO_RESULTS: ${NO_CONTEXT_REFUSAL}`;
          }

          return results
            .map(
              (r, i) =>
                `[${i + 1}] (relevance ${(r.similarity * 100).toFixed(0)}%) ${r.content}`
            )
            .join("\n\n");
        } catch (error) {
          console.error("Search error:", error);
          return `NO_RESULTS: ${NO_CONTEXT_REFUSAL}`;
        }
      },
    }),
  };
}

export type ChatTools = InferUITools<ReturnType<typeof createSearchTool>>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Sign in required to use chat." },
        { status: 401 }
      );
    }

    if (!(await userHasDocuments(userId))) {
      return Response.json(
        {
          error:
            "Upload a PDF first. Chat is only available after you add your document.",
        },
        { status: 403 }
      );
    }

    const { messages }: { messages: ChatMessage[] } = await req.json();
    const lastUserText = getLastUserMessageText(messages);

    if (!lastUserText || lastUserText.length < MIN_QUERY_LENGTH) {
      return Response.json(
        { error: "Please enter a question about your uploaded PDF." },
        { status: 400 }
      );
    }

    const tools = createSearchTool(userId);

    const result = streamText({
      model: openrouter("openai/gpt-oss-120b:free"),
      messages: convertToModelMessages(messages),
      tools,
      toolChoice: "required",
      system: RAG_SYSTEM_PROMPT,
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error streaming chat completion:", error);
    return new Response("Failed to stream chat completion", { status: 500 });
  }
}
