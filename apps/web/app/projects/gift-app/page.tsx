import type { Metadata } from "next";
import Link from "next/link";
import GiftAppDemo from "@/components/gift-app/GiftAppDemo";

export const metadata: Metadata = {
  title: "What to Get Me for My Birthday",
  description:
    "I spend my nine-to-five configuring enterprise software with meaningful environmental implications. So naturally, I used my free time to build a RAG system that tells people what to buy me.",
};

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
      {children}
    </p>
  );
}

function StatCard({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-2xl font-semibold tracking-tight text-stone-900 mb-0.5">{value}</p>
      <p className="text-sm text-stone-600 mb-1">{label}</p>
      {note && <p className="text-xs text-stone-400">{note}</p>}
    </div>
  );
}

function Decision({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[32px_1fr] gap-3">
      <div className="flex items-start justify-center pt-0.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 shrink-0">
          {n}
        </span>
      </div>
      <div>
        <h4 className="font-semibold text-stone-900 text-sm mb-2">{title}</h4>
        <div className="text-sm text-stone-500 leading-relaxed space-y-2">{body}</div>
      </div>
    </div>
  );
}

export default function GiftAppCaseStudy() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-12">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-900 transition-colors mb-10"
      >
        ← All projects
      </Link>

      {/* Page header */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
          Personal Project · 2025
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-3">
          What to Get Me for My Birthday
        </h1>
        <p className="text-base text-stone-500 leading-relaxed mb-5 max-w-2xl">
          By day I build tools with real implications: energy efficiency forecasting programs,
          EV charger site selection algorithms, smart climate action generation. Work I love and am proud of.
          So naturally, I used my free time to build a RAG system that tells
          people what to buy me. It indexes my personal bookmarks, enriches them with
          GPT-4o, and answers <em>"would Mallory like this?"</em> with grounded,
          explainable reasoning. <strong>Frivolous? Absolutely. Overengineered? Pretty much.</strong>{" "}
          A decent demo of hybrid vector search and agentic retrieval? Also yes.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Azure OpenAI (GPT-4o)",
            "Azure AI Search",
            "text-embedding-3-small",
            "FastAPI",
            "React / TypeScript",
            "Raindrop.io",
          ].map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[580px_1fr] gap-12 xl:gap-16 items-start">

        {/* LEFT: Sticky live demo */}
        <div className="h-[520px] lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <GiftAppDemo />
        </div>

        {/* RIGHT: Scrolling write-up */}
        <div className="space-y-14 pb-20">

          {/* Overview */}
          <section>
            <SectionLabel>Overview</SectionLabel>
            <p className="text-sm text-stone-500 leading-relaxed mb-5">
              Raindrop.io acts as the bookmark layer. Each save is enriched with GPT-4o,
              embedded into a 1536-d vector, and upserted into Azure AI Search. The chat
              can <em>only</em> reason from items I&apos;ve actually saved. No hallucinated
              preferences, no invented products.
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
                What it does
              </p>
              <ul className="space-y-1.5 text-sm text-stone-600">
                {[
                  "Syncs bookmarks from Raindrop.io",
                  "Enriches each item with GPT-4o (tags, style, summary)",
                  "Indexes in Azure AI Search (hybrid vector + keyword)",
                  "Browse grid with category filters + AI image fallback",
                  "Chat: grounded RAG answers with sources shown",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-indigo-400 shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Architecture */}
          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>Architecture</SectionLabel>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              Two distinct pipelines: ingestion runs on demand, retrieval runs on
              every chat message.
            </p>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">
                  Ingestion
                </p>
                <div className="flex flex-wrap items-center gap-0">
                  {[
                    { label: "Raindrop.io", sub: "API" },
                    { label: "FastAPI", sub: "sync router" },
                    { label: "GPT-4o", sub: "enrichment" },
                    { label: "Embedding", sub: "text-embedding-3-small" },
                    { label: "AI Search", sub: "index upsert" },
                  ].map((node, i, arr) => (
                    <div key={node.label} className="flex items-center">
                      <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-center">
                        <p className="text-xs font-medium text-stone-900">{node.label}</p>
                        <p className="text-[10px] text-stone-400">{node.sub}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <span className="text-stone-300 text-xs mx-0.5">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">
                  Retrieval (per message)
                </p>
                <div className="flex flex-wrap items-center gap-0">
                  {[
                    { label: "Question", sub: "from chat" },
                    { label: "Embedding", sub: "query vector" },
                    { label: "AI Search", sub: "hybrid search" },
                    { label: "GPT-4o", sub: "grounded answer" },
                  ].map((node, i, arr) => (
                    <div key={node.label} className="flex items-center">
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-center">
                        <p className="text-xs font-medium text-indigo-900">{node.label}</p>
                        <p className="text-[10px] text-indigo-400">{node.sub}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <span className="text-indigo-200 text-xs mx-0.5">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Engineering Decisions */}
          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>Engineering Decisions</SectionLabel>
            <div className="space-y-8">

              <Decision
                n={1}
                title="Agentic web search + SSE streaming once latency became visible"
                body={
                  <>
                    <p>
                      The chat started as a single round-trip: embed, search, generate, ~2s.
                      Then shopping intent detection added 3-4 parallel Tavily web searches,
                      pushing time-to-first-response to 6-10 seconds.
                    </p>
                    <p>
                      SSE fixed it. The backend returns a{" "}
                      <code className="bg-stone-100 px-1 rounded text-xs font-mono">
                        text/event-stream
                      </code>{" "}
                      immediately, emits named status events as each step completes, then streams
                      GPT-4o tokens as they arrive. Plain HTTP response, no websocket upgrade,
                      works through any reverse proxy.
                    </p>
                  </>
                }
              />

              <Decision
                n={2}
                title="Hybrid search: BM25 + vector, fused with Reciprocal Rank Fusion"
                body={
                  <p>
                    Vector search handles "something with a cozy Scandinavian feel" but fails on
                    "Le Creuset dutch oven." BM25 nails the exact match. Azure AI Search runs
                    both in parallel and fuses the ranked lists with Reciprocal Rank Fusion. The
                    top 8 results go into the GPT-4o prompt with a strict grounding instruction:
                    answer only from context, cite your sources.
                  </p>
                }
              />

              <Decision
                n={3}
                title="GPT-4o for enrichment, embedding the enriched representation"
                body={
                  <>
                    <p>
                      Enrichment quality determines retrieval quality. GPT-4o extracts structured
                      metadata before anything gets indexed:
                    </p>
                    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-xs text-stone-600 leading-relaxed">
                      {`category: beauty | fashion | home | kitchen | other`}<br />
                      {`tags: up to 8 descriptive labels`}<br />
                      {`style_keywords: up to 5 (e.g. "japandi", "wabi-sabi", "coastal")`}<br />
                      {`colors, materials, summary`}
                    </div>
                    <p>
                      The embedding is generated from this enriched representation, not the raw
                      title, so a query like "earthy and handmade for the kitchen" surfaces the
                      right items without exact-word matches. GPT-4o over a smaller model produced
                      richer style keywords and is worth the cost since syncs are infrequent.
                    </p>
                  </>
                }
              />

              <Decision
                n={4}
                title="Managed identity instead of stored API keys"
                body={
                  <p>
                    System-assigned Azure identity with scoped RBAC roles: Cognitive Services
                    OpenAI User on the OpenAI resource, Search Index Data Reader on the search
                    service. No keys stored in production, no rotation, no secrets to audit.
                    Key auth only kicks in locally when an env var is present.
                  </p>
                }
              />

              <Decision
                n={5}
                title="Layered cost controls on a public endpoint"
                body={
                  <>
                    <p>Four independent layers, any one sufficient to stop runaway spend:</p>
                    <ul className="list-none space-y-1 mt-1">
                      {[
                        "Per-IP and global daily chat limits in code",
                        "Admin token required for /sync and /generate (404 without it)",
                        "TPM quota cap on each OpenAI deployment",
                        "Azure budget auto-shutoff via Automation runbook at 100% of monthly budget",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-stone-300 shrink-0">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                }
              />

              <Decision
                n={6}
                title="One container serving both the API and the frontend"
                body={
                  <p>
                    FastAPI serves the built React dist at the root: one container, one deploy,
                    one origin. No CORS config, no separate hosting cost. Build runs in Azure
                    Container Registry so the environment matches production exactly.
                  </p>
                }
              />

              <Decision
                n={7}
                title="Image proxy to bypass hotlink blocking"
                body={
                  <p>
                    Shopify, eBay, and most retailers block direct image embeds from non-origin
                    domains. A{" "}
                    <code className="bg-stone-100 px-1 rounded text-xs font-mono">
                      /api/proxy/image
                    </code>{" "}
                    endpoint fetches and streams server-side, bypassing the block. Post-launch
                    discovery. Build it in from day one.
                  </p>
                }
              />
            </div>
          </section>

          {/* Metrics */}
          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>Metrics</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <StatCard value="2–8s" label="Avg chat latency" note="Simple queries ~2s, shopping queries (web search) ~6–8s" />
              <StatCard value="$0/mo" label="Current AI Search cost" note="Running on Free tier" />
              <StatCard value="8" label="Top-k retrieved" note="Per chat query" />
              <StatCard value="~$0.01" label="Per LLM call" note="GPT-4o, embed + generate" />
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1.5">
                Cost note
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">
                Running on the Azure AI Search <strong>Free tier</strong>. It handles
                this scale (a few hundred documents, low QPS) just fine. For a real
                production project I&apos;d upgrade to <strong>Basic (~$25/month flat,
                regardless of usage)</strong>: it unlocks the semantic reranker, which
                does a second-pass language-model reranking of results and meaningfully
                improves retrieval quality over BM25 + vector fusion alone.
              </p>
            </div>
          </section>

          {/* If I Were to Improve It */}
          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>If I Were to Improve It</SectionLabel>
            <ol className="space-y-4 list-none">
              {[
                {
                  step: "01",
                  title: "Add a feedback loop",
                  body: "Thumbs up / thumbs down on chat answers, stored and used to fine-tune retrieval weights or bump relevant items. Right now there's no signal back into the system.",
                },
                {
                  step: "02",
                  title: "Scheduled re-sync",
                  body: "Raindrop bookmarks are manually synced. An Azure Function on a daily cron would keep the index fresh without any intervention.",
                },
                {
                  step: "03",
                  title: "Expand data sources",
                  body: "Right now it's Raindrop only. Pinterest boards, Are.na channels, or even a simple manual upload form would give the model a richer taste profile to reason over.",
                },
              ].map(({ step, title, body }) => (
                <li key={step} className="flex gap-4">
                  <span className="text-xs font-semibold text-stone-300 tabular-nums pt-0.5 w-5 shrink-0">{step}</span>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-stone-900 text-sm">{title}</h4>
                    <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Footer nav */}
          <div className="pt-10 border-t border-stone-200 flex justify-between items-center">
            <Link
              href="/projects"
              className="text-sm text-stone-400 hover:text-stone-900 transition-colors"
            >
              ← All projects
            </Link>
            <a
              href="mailto:mallorygiesie@icloud.com"
              className="text-sm text-stone-400 hover:text-stone-900 transition-colors"
            >
              Get in touch →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
