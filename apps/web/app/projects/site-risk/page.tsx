import type { Metadata } from "next";
import Link from "next/link";
import SiteRiskDemo from "@/components/site-risk/SiteRiskDemo";

export const metadata: Metadata = {
  title: "SiteRisk",
  description:
    "A multi-agent system that fans out across four government APIs in parallel and streams a real-time environmental risk assessment for any US address.",
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

export default function SiteRiskCaseStudy() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-12">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-900 transition-colors mb-10"
      >
        ← All projects
      </Link>

      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
          Personal Project · 2026
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-3">
          SiteRisk
        </h1>
        <p className="text-base text-stone-500 leading-relaxed mb-5 max-w-2xl">
          I spend a lot of time building AI tools for clients who need to reason about environmental
          risk: utility infrastructure, FEMA planning workflows, federal resilience programs. SiteRisk
          is a multi-agent system that hits four federal government APIs in parallel and synthesizes a
          compound environmental risk assessment for any US address in real time. Wildfire, flood, air
          quality, weather. The part that
          makes it more than a dashboard is the reasoning layer: an orchestrator decides which
          agents are relevant to your context, the agents interpret raw government data with
          domain-expert prompts, and a synthesis agent explains what the combination means in plain
          language.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Azure OpenAI (GPT-4o)",
            "FastAPI",
            "Multi-Agent Orchestration",
            "NASA FIRMS",
            "NIFC Fire Perimeters",
            "FEMA NFHL",
            "OpenFEMA",
            "EPA AirNow",
            "NOAA NWS",
            "Open-Meteo",
            "NASA GIBS (NDVI)",
            "US Census Bureau",
            "React / TypeScript",
            "CartoDB Voyager",
            "Leaflet",
          ].map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[520px_1fr] gap-12 xl:gap-16 items-start">

        {/* LEFT: Illustrative demo */}
        <div className="h-[640px] lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <SiteRiskDemo />
        </div>

        {/* RIGHT: Write-up */}
        <div className="space-y-14 pb-20">

          <section>
            <SectionLabel>Overview</SectionLabel>
            <p className="text-sm text-stone-500 leading-relaxed mb-5">
              Each assessment starts with a geocoding step (US Census Bureau API, no key required),
              then an orchestrator LLM reads the user&apos;s stated context and routes to the relevant
              subset of agents. &quot;Planning a hike&quot; skips the flood agent. &quot;Buying a house&quot; runs all
              four. The selected agents fan out in parallel, each hitting its own data source and
              interpreting the results through a domain-specific system prompt. As each agent
              finishes, its risk card streams to the frontend immediately. Once all complete, a
              synthesis agent streams a narrative briefing explaining the compound risk picture.
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
                Data sources
              </p>
              <ul className="space-y-1.5 text-sm text-stone-600">
                {[
                  "NASA FIRMS VIIRS NRT: active fire pixel detections, updated every 3 hours",
                  "NIFC Active Fire Perimeters: official containment boundaries (ArcGIS, no key)",
                  "FEMA NFHL: flood zone classification for the exact parcel point",
                  "OpenFEMA Disaster Declarations: historical major disaster events",
                  "EPA AirNow: real-time AQI from the nearest monitoring station (free key)",
                  "NOAA NWS: active watches, warnings, and advisories (no key required)",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-indigo-400 shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>Architecture</SectionLabel>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              One SSE stream from a single{" "}
              <code className="bg-stone-100 px-1 rounded text-xs font-mono">POST /assess</code>{" "}
              endpoint. The backend yields named events as each step completes, so the frontend
              can render cards progressively rather than waiting for all agents to finish.
            </p>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">
                  SSE event sequence
                </p>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "status", sub: "Locating address..." },
                    { label: "location", sub: "lat/lng from Census geocoder" },
                    { label: "agents_selected", sub: "orchestrator LLM routing decision" },
                    { label: "agent_running", sub: "×N, one per selected agent" },
                    { label: "risk_update", sub: "×N, as each agent completes" },
                    { label: "briefing_token", sub: "streamed synthesis narrative" },
                    { label: "done", sub: "summary score" },
                  ].map((node, i, arr) => (
                    <div key={node.label} className="flex items-center gap-2">
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 min-w-[140px]">
                        <p className="text-xs font-mono font-medium text-indigo-900">{node.label}</p>
                        <p className="text-[10px] text-indigo-400">{node.sub}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <span className="text-indigo-200 text-xs">↓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>Engineering Decisions</SectionLabel>
            <div className="space-y-8">

              <Decision
                n={1}
                title="Why this is agentic and not just a dashboard"
                body={
                  <>
                    <p>
                      Fetching AQI and displaying it is deterministic. The agents earn their place
                      in three specific ways: compound risk synthesis (AQI 178 + Red Flag Warning +
                      active fire 12 miles away means something categorically worse than any one
                      alone, and that interaction effect can&apos;t be captured in a scoring rubric
                      without it becoming an unmaintainable rules engine); graceful degradation
                      (when the FEMA API times out, the flood agent reasons from what it does have
                      rather than returning a null card); and context-sensitive interpretation (risk
                      means different things for a weekend hike versus a property purchase).
                    </p>
                    <p>
                      The agents also make extensibility trivial. Adding an earthquake risk
                      dimension in v2 is adding one file.
                    </p>
                  </>
                }
              />

              <Decision
                n={2}
                title="Dynamic routing before the fan-out"
                body={
                  <p>
                    The orchestrator makes one cheap LLM call before spinning up any agents. It
                    reads the user&apos;s stated context and returns a JSON array of relevant dimensions.
                    &quot;Planning a hike this weekend&quot; returns{" "}
                    <code className="bg-stone-100 px-1 rounded text-xs font-mono">
                      [&quot;wildfire&quot;, &quot;air_quality&quot;, &quot;weather&quot;]
                    </code>
                    . &quot;Buying a house&quot; returns all four. This is the behavior that makes it
                    clearly agentic rather than just parallel: the system reasons about what to do
                    before doing it.
                  </p>
                }
              />

              <Decision
                n={3}
                title="asyncio.wait(FIRST_COMPLETED) for the card-by-card reveal"
                body={
                  <>
                    <p>
                      The four agents run as concurrent asyncio tasks. Using{" "}
                      <code className="bg-stone-100 px-1 rounded text-xs font-mono">
                        asyncio.wait(return_when=FIRST_COMPLETED)
                      </code>{" "}
                      means each card is yielded as an SSE event the moment its agent finishes,
                      not after the slowest agent catches up. NOAA NWS typically responds in
                      under a second; NASA FIRMS can take 3-4 seconds. With{" "}
                      <code className="bg-stone-100 px-1 rounded text-xs font-mono">gather()</code>
                      , the user waits for the slowest. With{" "}
                      <code className="bg-stone-100 px-1 rounded text-xs font-mono">wait(FIRST_COMPLETED)</code>
                      , cards appear progressively and the architecture is visible in the UI.
                    </p>
                  </>
                }
              />

              <Decision
                n={4}
                title="Domain-expert system prompts do the real work"
                body={
                  <p>
                    Each agent&apos;s system prompt encodes actual domain knowledge, not just
                    &quot;summarize this data.&quot; The fire agent knows that FRP above 500 MW indicates
                    rapidly spreading fire, that daytime detections with high FRP are more dangerous
                    than nighttime ones, and that fire pixels within 10 km are imminent regardless
                    of count. The flood agent knows what FEMA Zone AE means and how to distinguish
                    a studied versus approximated floodplain. The weather agent knows the NWS alert
                    severity hierarchy. This is where an environmental science background actually
                    matters for AI output quality.
                  </p>
                }
              />

              <Decision
                n={5}
                title="Graceful degradation as a first-class design requirement"
                body={
                  <>
                    <p>
                      Every agent has two retry attempts with exponential backoff via tenacity. If
                      both fail, the agent returns a{" "}
                      <code className="bg-stone-100 px-1 rounded text-xs font-mono">RiskDimension</code>{" "}
                      with{" "}
                      <code className="bg-stone-100 px-1 rounded text-xs font-mono">agent_skipped=True</code>{" "}
                      and a plain-language explanation rather than an error card. The synthesis
                      agent sees the skipped flag and adjusts its narrative accordingly, noting
                      which data was unavailable and suggesting where to check directly. The
                      assessment is still useful with partial data.
                    </p>
                    <p>
                      This mirrors an explicit engineering decision I made at ICF on a FEMA
                      planning workflow: deterministic processing paired with coordinated LLM
                      calls, engineered to degrade gracefully with retries, timeouts, and a
                      manual fallback when model confidence is low.
                    </p>
                  </>
                }
              />

              <Decision
                n={6}
                title="Free government APIs, no scraping"
                body={
                  <p>
                    NOAA NWS, FEMA NFHL, OpenFEMA, NIFC fire perimeters, and the Census geocoder
                    all require no API key. NASA FIRMS and EPA AirNow require free registration.
                    Every data source is a legitimate, documented public API with stable endpoints
                    and no rate-limit concerns at this usage level. The environmental data ecosystem
                    is genuinely rich and underused by AI applications.
                  </p>
                }
              />
            </div>
          </section>

          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>What I Built in v2</SectionLabel>
            <ol className="space-y-4 list-none mb-10">
              {[
                {
                  step: "01",
                  title: "Fire spread threat vector",
                  body: "Added Open-Meteo for live wind speed and direction. The fire agent now computes which active FIRMS fire pixels are upwind of the site using bearing/alignment math, and estimates how long the fire would take to reach the location at current wind speed (simplified Rothermel spread rate: 30% of wind speed). Rendered as an animated cone and arrow on the map.",
                },
                {
                  step: "02",
                  title: "County disaster history agent",
                  body: "A fifth agent uses the Census Bureau's geocoder to resolve county FIPS codes, then queries OpenFEMA for every federally declared disaster in that county going back to 1953. Returns a scored risk profile with a decade-by-decade breakdown, hazard type distribution, and the most recent notable events. Adds temporal context to the point-in-time risk scores.",
                },
                {
                  step: "03",
                  title: "NDVI vegetation density layer",
                  body: "NASA GIBS serves MODIS Terra NDVI 8-day composites as WMTS tiles at no cost. A toggle on the map overlays current vegetation density — brown for sparse/dry, green for dense — giving a direct visual proxy for wildfire fuel load at landscape scale.",
                },
                {
                  step: "04",
                  title: "System prompt transparency",
                  body: "Each risk card has an expandable section showing the full system prompt used to interpret that dimension's data. The goal is making the reasoning layer legible: visitors can see exactly what domain knowledge was encoded and how the agent was instructed to weight different signals.",
                },
              ].map(({ step, title, body }) => (
                <li key={step} className="flex gap-4">
                  <span className="text-xs font-semibold text-stone-300 tabular-nums pt-0.5 w-5 shrink-0">
                    {step}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-stone-900 text-sm">{title}</h4>
                    <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <SectionLabel>What I Would Build Next</SectionLabel>
            <ol className="space-y-4 list-none">
              {[
                {
                  step: "01",
                  title: "Multi-address comparison",
                  body: "The most useful version for a homebuyer is a side-by-side comparison of two or three candidate addresses. The parallel agent architecture makes this mostly an orchestration change — fan out one set of agents per address, stream results per-address.",
                },
                {
                  step: "02",
                  title: "Eval framework",
                  body: "A small golden set of address/expected-risk-level pairs that can be run as a regression check when agent prompts or data sources change. Without it there is no confident way to iterate on the domain-expert prompts.",
                },
                {
                  step: "03",
                  title: "Superfund and contamination agent",
                  body: "EPA EnviroFacts has a public API for Superfund sites, RCRA hazardous waste facilities, and air emissions. A contamination dimension would make this genuinely useful for due diligence on older industrial parcels.",
                },
              ].map(({ step, title, body }) => (
                <li key={step} className="flex gap-4">
                  <span className="text-xs font-semibold text-stone-300 tabular-nums pt-0.5 w-5 shrink-0">
                    {step}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-stone-900 text-sm">{title}</h4>
                    <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

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
