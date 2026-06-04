# Vercel RAG Chatbot

A full-stack **Retrieval-Augmented Generation (RAG)** chat application built with **Next.js 15**, the **Vercel AI SDK**, **Neon PostgreSQL (pgvector)**, and **Clerk** authentication. Users sign in, upload a PDF, and chat with an AI that answers **only from their document** using semantic search and tool-based retrieval.

## What it does

1. **Sign in** — Clerk protects `/chat`, `/upload`, and API routes.
2. **Upload a PDF** (max 5 MB) — Text is extracted, split into chunks, embedded, and stored per user in Neon.
3. **Chat** — The model must call a `searchKnowledgeBase` tool before answering. Retrieval is scoped to the signed-in user’s chunks. Off-topic or empty-context questions are refused via guardrails.

Each new PDF upload **replaces** the user’s previous document chunks.

## RAG pipeline

```mermaid
flowchart LR
  PDF[PDF upload] --> Parse[pdf-parse]
  Parse --> Chunk[LangChain text splitter]
  Chunk --> Embed[embedMany via AI SDK]
  Embed --> Store[(Neon + pgvector)]
  Query[User question] --> QEmbed[Query embedding]
  QEmbed --> Search[Cosine similarity HNSW]
  Store --> Search
  Search --> Tool[searchKnowledgeBase tool]
  Tool --> LLM[streamText + OpenRouter]
  LLM --> UI[Chat UI stream]
```

### Techniques used

| Stage          | Technique                       | Implementation                                                                   |
| -------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| **Ingestion**  | PDF text extraction             | `pdf-parse` in a Server Action                                                   |
| **Chunking**   | Recursive character splitting   | `@langchain/textsplitters` (800 chars, 100 overlap)                              |
| **Embedding**  | Dense vectors (1536-d)          | Vercel AI SDK `embed` / `embedMany` + OpenRouter `openai/text-embedding-3-small` |
| **Storage**    | Vector database                 | Neon Postgres + `pgvector` extension                                             |
| **Indexing**   | Approximate nearest neighbor    | HNSW index with `vector_cosine_ops`                                              |
| **Retrieval**  | Semantic search                 | Drizzle `cosineDistance`, similarity threshold, top-k                            |
| **Generation** | Tool-augmented chat             | AI SDK `streamText` with required tool call + strict system prompt               |
| **Safety**     | Per-user isolation + guardrails | `user_id` on all rows; auth checks; PDF-only answers                             |

## Tech stack

### Core

- **[Next.js 15](https://nextjs.org/)** — App Router, Server Actions, Route Handlers, Turbopack dev
- **[React 19](https://react.dev/)** — UI
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Styling

### Vercel AI SDK

- **[`ai`](https://sdk.vercel.ai/docs)** (v5) — `streamText`, `embed`, `embedMany`, tools, streaming UI messages
- **`@ai-sdk/react`** — `useChat` on the chat page
- **`@openrouter/ai-sdk-provider`** — Single gateway for chat + embeddings (OpenRouter models)

Chat route highlights (`src/app/api/chat/route.ts`):

- `streamText()` with streaming response via `toUIMessageStreamResponse()`
- `tool()` + Zod schema for `searchKnowledgeBase`
- `toolChoice: "required"` so the model searches before answering
- `stepCountIs(3)` to cap agent steps

### Database

- **[Neon](https://neon.tech/)** — Serverless PostgreSQL (`@neondatabase/serverless`)
- **[Drizzle ORM](https://orm.drizzle.team/)** — Schema, queries, migrations (`drizzle-kit`)
- **[pgvector](https://github.com/pgvector/pgvector)** — `vector(1536)` column + HNSW index

Schema (`src/lib/db-schema.ts`):

- `documents` — `id`, `user_id`, `content`, `embedding`

### Auth

- **[Clerk](https://clerk.com/)** (`@clerk/nextjs`) — Sign-in/up, middleware protection, per-user document scope

### Other libraries

- **`pdf-parse`** — PDF → plain text
- **`@langchain/textsplitters`** — Chunking
- **`zod`** — Tool input validation
- **Radix UI + shadcn-style components** — UI primitives
- **AI Elements** (`src/components/ai-elements/`) — Chat conversation, prompt input, loaders
- **Biome** — Lint/format

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # RAG chat (streamText + tools)
│   │   └── documents/status/      # Check if user has uploaded chunks
│   ├── chat/page.tsx              # Chat UI (useChat)
│   ├── upload/
│   │   ├── page.tsx               # PDF upload UI
│   │   └── actions.ts             # Ingest pipeline (server action)
│   └── page.tsx                   # Landing page
├── lib/
│   ├── embeddings.ts              # OpenRouter embeddings (batched)
│   ├── chunking.ts                # Text splitting
│   ├── search.ts                  # Vector similarity search
│   ├── rag-guardrails.ts          # System prompt + refusal messages
│   ├── db-schema.ts               # Drizzle schema
│   └── user-documents.ts          # Per-user chunk helpers
└── middleware.ts                  # Clerk auth
migrations/                        # SQL migrations (pgvector + documents)
```

## Prerequisites

- **Node.js** 20+
- **npm** (or pnpm/yarn)
- Accounts / keys for:
  - [Clerk](https://dashboard.clerk.com/)
  - [OpenRouter](https://openrouter.ai/)
  - [Neon](https://console.neon.tech/) (Postgres with pgvector)

## Environment variables

Create **`.env.local`** in the project root (used by Next.js, Drizzle, and `db-config`):

```env
# Neon — Connection string with ?sslmode=require
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# OpenRouter — Chat + embeddings
OPENROUTER_API_KEY=sk-or-v1-your_key_here

# Clerk — https://dashboard.clerk.com → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

| Variable                            | Required | Purpose                                 |
| ----------------------------------- | -------- | --------------------------------------- |
| `NEON_DATABASE_URL`                 | Yes      | Postgres + pgvector for document chunks |
| `OPENROUTER_API_KEY`                | Yes      | LLM chat and embedding API calls        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes      | Clerk client                            |
| `CLERK_SECRET_KEY`                  | Yes      | Clerk server / middleware               |

Do not commit `.env.local` (already in `.gitignore`).

## Setup and run

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the template above into `.env.local` and fill in your real keys.

### 3. Run database migrations

Enables the `vector` extension, creates `documents`, and adds `user_id`:

```bash
npx drizzle-kit migrate
```

If migrate fails, apply SQL manually from `migrations/` in order (`0000` → `0001` → `0002`).

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Server Action upload limit is **5 MB** (`experimental.serverActions.bodySizeLimit` in `next.config.ts`). Restart the dev server after changing `next.config.ts`.

### 5. Use the app

1. Open the site and **sign in** (Clerk).
2. Go to **Upload** and select a PDF (≤ 5 MB).
3. Wait for processing (chunking + embeddings).
4. Open **Chat** and ask questions about your PDF.

## Available scripts

| Command                   | Description                         |
| ------------------------- | ----------------------------------- |
| `npm run dev`             | Start dev server (Turbopack)        |
| `npm run build`           | Production build                    |
| `npm run start`           | Run production server               |
| `npm run lint`            | Biome lint check                    |
| `npm run format`          | Biome format write                  |
| `npx drizzle-kit migrate` | Apply DB migrations                 |
| `npx drizzle-kit push`    | Push schema to DB (dev alternative) |
| `npx drizzle-kit studio`  | Open Drizzle Studio                 |

## API routes

| Route                   | Method | Description                                       |
| ----------------------- | ------ | ------------------------------------------------- |
| `/api/chat`             | POST   | Streaming RAG chat (auth + uploaded PDF required) |
| `/api/documents/status` | GET    | `{ hasDocuments, chunkCount }` for current user   |

## Configuration limits

| Setting                 | Value                           | Location                                      |
| ----------------------- | ------------------------------- | --------------------------------------------- |
| Max PDF size            | 5 MB                            | `src/app/upload/actions.ts`, `next.config.ts` |
| Max text chunks per PDF | 2000                            | `src/app/upload/actions.ts`                   |
| Embedding batch size    | 512                             | `src/lib/embeddings.ts`                       |
| Chunk size              | 800 chars                       | `src/lib/chunking.ts`                         |
| Chat model              | `openai/gpt-oss-120b:free`      | `src/app/api/chat/route.ts`                   |
| Embedding model         | `openai/text-embedding-3-small` | `src/lib/embeddings.ts`                       |
