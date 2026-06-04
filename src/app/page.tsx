import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Database,
  FileUp,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileUp,
    title: "Ingest documents",
    description:
      "Upload PDFs and turn them into searchable vector chunks stored in Neon.",
    accent: "from-cyan-500/20 to-cyan-500/5",
    iconClass: "text-cyan-400",
  },
  {
    icon: Database,
    title: "Semantic retrieval",
    description:
      "Embeddings power cosine similarity search across your knowledge base.",
    accent: "from-violet-500/20 to-violet-500/5",
    iconClass: "text-violet-400",
  },
  {
    icon: BrainCircuit,
    title: "Grounded answers",
    description:
      "The assistant searches your docs first, then responds with cited context.",
    accent: "from-fuchsia-500/20 to-fuchsia-500/5",
    iconClass: "text-fuchsia-400",
  },
];

const steps = [
  { label: "Upload", detail: "PDF → chunks" },
  { label: "Embed", detail: "OpenRouter vectors" },
  { label: "Ask", detail: "RAG-powered chat" },
];

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#030712] text-white">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_40%,transparent_100%)] opacity-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-violet-600/25 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-[90px]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-20 px-6 py-16 sm:px-10 sm:py-24">
        {/* Hero */}
        <section className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300 backdrop-blur-sm">
            <Sparkles className="size-4" aria-hidden />
            <span>Retrieval-Augmented Generation</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.1]">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
              Your documents,
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              one intelligent chat
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
            Upload knowledge, embed it in a vector store, and converse with an AI
            that searches your library before every answer.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full border-0 bg-gradient-to-r from-cyan-500 to-violet-600 px-8 text-base font-medium text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-violet-500"
            >
              <Link href="/chat">
                Start chatting
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-slate-700 bg-white/5 px-8 text-base text-slate-200 backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <Link href="/upload">
                <FileUp className="size-4" />
                Upload PDFs
              </Link>
            </Button>
          </div>

          {/* Pipeline */}
          <div className="mt-14 flex w-full max-w-xl flex-wrap items-center justify-center gap-3 sm:gap-4">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
                  <span className="text-xs font-medium uppercase tracking-widest text-cyan-400/90">
                    {step.label}
                  </span>
                  <span className="mt-0.5 font-mono text-sm text-slate-300">
                    {step.detail}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <Zap
                    className="hidden size-4 shrink-0 text-violet-400/80 sm:block"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-colors hover:border-cyan-500/30 hover:bg-white/[0.06]"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity group-hover:opacity-100`}
                aria-hidden
              />
              <div className="relative">
                <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-black/40 p-3">
                  <feature.icon
                    className={`size-6 ${feature.iconClass}`}
                    aria-hidden
                  />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </section>

        {/* CTA panel */}
        <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-[#0c1222] to-violet-950/50 p-8 sm:p-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.15),transparent_50%)]"
            aria-hidden
          />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-xl flex-col gap-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <MessageSquare className="size-5" aria-hidden />
                <span className="text-sm font-medium uppercase tracking-wider">
                  Ready when you are
                </span>
              </div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Sign in, upload a PDF, then ask anything about it.
              </h2>
              <p className="text-slate-400">
                Protected routes keep your workspace private. The model uses tool
                calls to query your embedded knowledge on demand.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="shrink-0 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-8 text-cyan-100 hover:bg-cyan-500/20"
            >
              <Link href="/chat">
                Open chat
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
