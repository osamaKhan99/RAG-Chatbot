// src/app/chat/page.tsx
"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FileUp, ShieldAlert } from "lucide-react";

type DocumentStatus = {
  authenticated: boolean;
  hasDocuments: boolean;
  chunkCount: number;
  error?: string;
};

export default function RAGChatBot() {
  const [input, setInput] = useState("");
  const [docStatus, setDocStatus] = useState<DocumentStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/documents/status");
      const data = (await res.json()) as DocumentStatus;
      setDocStatus(data);
    } catch {
      setDocStatus({
        authenticated: false,
        hasDocuments: false,
        chunkCount: 0,
      });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const canChat = docStatus?.hasDocuments === true;

  const { messages, sendMessage, status } = useChat({
    onError: (error) => {
      setChatError(error.message || "Failed to send message");
    },
    onFinish: () => {
      setChatError(null);
    },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text || !canChat) {
      return;
    }
    setChatError(null);
    sendMessage({
      text: message.text,
    });
    setInput("");
  };

  if (statusLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!canChat) {
    return (
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-lg flex-col items-center justify-center gap-6 p-6">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <ShieldAlert className="size-7 text-amber-400" aria-hidden />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Upload your PDF first</h1>
          <p className="text-muted-foreground">
            Chat is locked until you upload a document. Answers are restricted
            to your PDF only — general questions are not supported.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full">
          <Link href="/upload">
            <FileUp className="size-4" />
            Upload PDF
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto size-full h-[calc(100vh-4rem)] max-w-4xl p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Grounded in your PDF ({docStatus?.chunkCount ?? 0} chunks).{" "}
          <Link href="/upload" className="underline underline-offset-2">
            Replace document
          </Link>
        </p>
      </div>

      {docStatus?.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Knowledge base unavailable</AlertTitle>
          <AlertDescription>{docStatus.error}</AlertDescription>
        </Alert>
      )}

      {chatError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Chat error</AlertTitle>
          <AlertDescription>{chatError}</AlertDescription>
        </Alert>
      )}

      <div className="flex h-[calc(100%-2.5rem)] flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Ask a question about your uploaded PDF. I only answer from that
                document.
              </p>
            )}
            {messages.map((message) => (
              <div key={message.id}>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>{part.text}</Response>
                            </MessageContent>
                          </Message>
                        </Fragment>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {(status === "submitted" || status === "streaming") && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your uploaded PDF…"
              disabled={!canChat}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools />
            <PromptInputSubmit
              disabled={!input || status === "streaming" || !canChat}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
