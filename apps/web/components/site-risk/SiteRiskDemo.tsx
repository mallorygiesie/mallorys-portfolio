"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { streamAssessment, replaySnapshot } from "@/lib/site-risk/client";
import type { RiskDimension, SSEEvent } from "@/types/site-risk";

const SiteRiskMap = dynamic(() => import("./SiteRiskMap"), { ssr: false });

// ── Constants ────────────────────────────────────────────────────────────────

// Example chips replay pre-recorded snapshots (always work, always impressive).
// The free-text box always goes live against the real backend.
const EXAMPLES: { label: string; slug: string; address: string; context: string }[] = [
  { label: "Active fire threat", slug: "utah-fire",   address: "75 W Main St, Torrey, UT 84775", context: "want to visit my friends" },
  { label: "Coastal city",       slug: "sf-coastal",  address: "1 Market St, San Francisco, CA 94105", context: "thinking of moving here" },
  { label: "Tornado alley",      slug: "okc-tornado", address: "201 Robert S Kerr Ave, Oklahoma City, OK 73102", context: "buying a home" },
];

const LEVEL_COLORS: Record<string, string> = {
  Low: "#10b981",
  Moderate: "#f59e0b",
  High: "#f97316",
  "Very High": "#ef4444",
  Extreme: "#7c3aed",
};

const AGENT_LABELS: Record<string, string> = {
  wildfire: "Wildfire",
  flood: "Flood",
  air_quality: "Air Quality",
  weather: "Weather",
  history: "Disaster History",
};

const AGENT_PROMPTS: Record<string, { description: string; prompt: string }> = {
  wildfire: {
    description:
      "Fetches NASA FIRMS satellite fire detections and NIFC official perimeters, then computes a directional spread threat vector using live wind data from Open-Meteo.",
    prompt: `You are a wildfire risk analyst with expertise in fire behavior, weather-driven fire spread, and public safety assessment.

Key interpretation rules:
- Fire pixels within 10 km = imminent/extreme threat regardless of count
- FRP (Fire Radiative Power) > 500 MW = intense, rapidly spreading fire
- Active named fires within 50 km = High minimum
- Absence of detections does NOT mean no risk`,
  },
  flood: {
    description:
      "Queries FEMA NFHL for the precise flood zone classification at the coordinate, then pulls OpenFEMA disaster declarations for county-level historical context.",
    prompt: `You are a flood risk analyst with expertise in FEMA flood mapping and NFIP zone classifications.

FEMA Zone interpretation:
- Zone AE: High risk — 100-year floodplain, mandatory insurance
- Zone X (unshaded): Low risk — outside 500-year floodplain
- Zone VE: Very High / Extreme — coastal wave action zone
- Zone D: Undetermined risk — no flood study available`,
  },
  air_quality: {
    description:
      "Pulls real-time AQI observations from the EPA AirNow network — the same data feed used by airnow.gov.",
    prompt: `You are an air quality risk analyst with expertise in EPA AQI standards and atmospheric science.

EPA AQI breakpoints:
- 0–50: Good
- 51–100: Moderate
- 101–150: Unhealthy for Sensitive Groups
- 151–200: Unhealthy — everyone may be affected
- 201–300: Very Unhealthy
- 301+: Hazardous emergency conditions`,
  },
  weather: {
    description:
      "Retrieves all active NOAA National Weather Service watches, warnings, and advisories for the location's forecast zone.",
    prompt: `You are a severe weather risk analyst with expertise in NWS alert systems and meteorological hazards.

NWS alert hierarchy:
- Warning: Imminent or ongoing hazardous conditions (take action NOW)
- Watch: Conditions favorable within 12–48 hours (prepare)
- Advisory: Less serious conditions; indirect threat
- Red Flag Warning = critical fire weather — always elevates wildfire risk`,
  },
  history: {
    description:
      "Uses the US Census Bureau geocoder to resolve county FIPS codes, then queries OpenFEMA for every federally declared disaster in that county going back to 1953.",
    prompt: `You are a disaster risk historian. You receive all federally declared disasters for a US county going back decades.

Score based on frequency vs. US average (~1.5 declarations/county/year):
- 1 = Very infrequent (< 0.5/yr)
- 2 = Below average (0.5–1/yr)
- 3 = Average (1–2/yr)
- 4 = Above average (2–3/yr)
- 5 = High frequency (3+/yr or recent catastrophic events)`,
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function RiskCardView({
  result,
}: {
  result: RiskDimension;
}) {
  const [promptOpen, setPromptOpen] = useState(false);
  const color = LEVEL_COLORS[result.level] ?? "#64748b";
  const meta = AGENT_PROMPTS[result.dimension];

  return (
    <div className="rounded-lg bg-white border border-slate-200 flex flex-col overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
      <div className="h-[3px] shrink-0" style={{ background: color }} />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {AGENT_LABELS[result.dimension] ?? result.dimension}
          </span>
          <div className="flex items-baseline gap-0.5" style={{ color }}>
            <span className="text-xl font-black leading-none">{result.score}</span>
            <span className="text-[9px] opacity-50 font-medium">/5</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
            {result.level}
          </span>
        </div>

        {result.agent_skipped ? (
          <p className="text-[9px] text-slate-400 italic">{result.skip_reason ?? "Data temporarily unavailable"}</p>
        ) : (
          <>
            <p className="text-[10px] font-medium text-slate-800 leading-tight">{result.headline}</p>
            <ul className="space-y-0.5">
              {result.details.slice(0, 3).map((d, i) => (
                <li key={i} className="text-[8.5px] text-slate-500 leading-tight pl-2.5 relative">
                  <span className="absolute left-0 text-slate-300 text-[9px]">—</span>
                  {d}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {meta && (
        <>
          <button
            className="w-full flex items-center justify-between px-3 py-1.5 border-t border-slate-100 hover:bg-slate-50 transition-colors text-left"
            onClick={() => setPromptOpen((o) => !o)}
          >
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">System Prompt</span>
            <span className="text-slate-300 text-xs" style={{ display: "inline-block", transform: promptOpen ? "rotate(270deg)" : "rotate(90deg)", transition: "transform 0.2s" }}>
              ›
            </span>
          </button>
          {promptOpen && (
            <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-2">
              <p className="text-[8.5px] text-slate-500 leading-relaxed">{meta.description}</p>
              <pre className="text-[8px] font-mono text-slate-500 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                {meta.prompt}
              </pre>
            </div>
          )}
        </>
      )}

      <div className="px-3 py-1.5 border-t border-slate-100">
        <span className="text-[7.5px] text-slate-300">{result.sources.join(" · ")}</span>
      </div>
    </div>
  );
}

interface HistoryProfile {
  total: number;
  county: string;
  state: string;
  by_type: Record<string, number>;
  by_decade: Record<string, number>;
  year_range?: [number, number];
  notable?: Array<{ number: string; title: string; type: string; date: string }>;
}

function HistoryCardView({ result }: { result: RiskDimension }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const color = LEVEL_COLORS[result.level] ?? "#64748b";
  const profile = result.geojson as HistoryProfile | null;
  const meta = AGENT_PROMPTS.history;

  const decadeEntries = profile
    ? Object.entries(profile.by_decade).sort((a, b) => a[0].localeCompare(b[0]))
    : [];
  const maxCount = Math.max(...decadeEntries.map(([, v]) => v), 1);

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
      <div className="h-[3px] shrink-0" style={{ background: color }} />
      <div className="p-3">
        <div className="flex justify-between items-start mb-1.5">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Disaster History</span>
            {profile && (
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">{profile.county}, {profile.state}</p>
            )}
          </div>
          <div className="flex items-baseline gap-0.5" style={{ color }}>
            <span className="text-xl font-black leading-none">{result.score}</span>
            <span className="text-[9px] opacity-50">/5</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{result.level}</span>
        </div>

        {profile ? (
          <>
            <div className="flex gap-5 mb-3">
              <div>
                <p className="text-base font-black text-slate-900 leading-none">{profile.total}</p>
                <p className="text-[7.5px] font-bold uppercase tracking-wide text-slate-400">declarations</p>
              </div>
              {profile.year_range?.length === 2 && (
                <div>
                  <p className="text-base font-black text-slate-900 leading-none">
                    {(profile.total / Math.max(profile.year_range[1] - profile.year_range[0], 1)).toFixed(1)}
                  </p>
                  <p className="text-[7.5px] font-bold uppercase tracking-wide text-slate-400">per year</p>
                </div>
              )}
              {Object.keys(profile.by_type).length > 0 && (
                <div>
                  <p className="text-base font-black text-slate-900 leading-none truncate max-w-16">
                    {Object.keys(profile.by_type)[0]}
                  </p>
                  <p className="text-[7.5px] font-bold uppercase tracking-wide text-slate-400">top hazard</p>
                </div>
              )}
            </div>

            {decadeEntries.length > 0 && (
              <div className="mb-2">
                <p className="text-[7.5px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">By decade</p>
                <div className="flex items-end gap-1 h-9">
                  {decadeEntries.map(([decade, count]) => (
                    <div key={decade} className="flex flex-col items-center gap-0.5 flex-1">
                      <div
                        className="w-full rounded-sm"
                        style={{ height: `${Math.round((count / maxCount) * 28)}px`, background: "#6366f1", minHeight: 2 }}
                      />
                      <span className="text-[6px] text-slate-400 font-medium">
                        {decade.slice(2, 4)}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.notable && profile.notable.length > 0 && (
              <div className="space-y-1">
                <p className="text-[7.5px] font-bold uppercase tracking-widest text-slate-400">Recent</p>
                {profile.notable.slice(0, 3).map((e) => (
                  <div key={e.number} className="flex items-baseline gap-2">
                    <span className="text-[8px] font-bold text-indigo-500 shrink-0 min-w-[56px]">{e.number}</span>
                    <span className="text-[8px] text-slate-600 flex-1 truncate">{e.title}</span>
                    <span className="text-[7.5px] text-slate-400 shrink-0">{e.date?.slice(0, 7)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[9px] text-slate-700 leading-tight">{result.headline}</p>
        )}
      </div>

      {meta && (
        <>
          <button
            className="w-full flex items-center justify-between px-3 py-1.5 border-t border-slate-100 hover:bg-slate-50 transition-colors text-left"
            onClick={() => setPromptOpen((o) => !o)}
          >
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">System Prompt</span>
            <span className="text-slate-300 text-xs" style={{ display: "inline-block", transform: promptOpen ? "rotate(270deg)" : "rotate(90deg)", transition: "transform 0.2s" }}>›</span>
          </button>
          {promptOpen && (
            <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-2">
              <p className="text-[8.5px] text-slate-500 leading-relaxed">{meta.description}</p>
              <pre className="text-[8px] font-mono text-slate-500 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">{meta.prompt}</pre>
            </div>
          )}
        </>
      )}

      <div className="px-3 py-1.5 border-t border-slate-100">
        <span className="text-[7.5px] text-slate-300">OpenFEMA · US Census Bureau · {result.data_as_of}</span>
      </div>
    </div>
  );
}

// ── Main demo ─────────────────────────────────────────────────────────────────

export default function SiteRiskDemo() {
  const [address, setAddress] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<RiskDimension[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [briefing, setBriefing] = useState("");
  const [briefingStreaming, setBriefingStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ndviDate, setNdviDate] = useState<string | null>(null);
  const [isSnapshot, setIsSnapshot] = useState(false);

  const reset = () => {
    setStatusText("");
    setSelectedAgents([]);
    setRunningAgents(new Set());
    setCompletedAgents(new Set());
    setResults([]);
    setLocation(null);
    setBriefing("");
    setBriefingStreaming(false);
    setError(null);
    setNdviDate(null);
  };

  const processEvent = (event: SSEEvent) => {
    switch (event.type) {
      case "status":
        setStatusText(event.text);
        break;
      case "location":
        setLocation({ lat: event.lat, lng: event.lng });
        break;
      case "agents_selected":
        setSelectedAgents(event.agents);
        break;
      case "agent_running":
        setRunningAgents((prev) => new Set([...prev, event.dimension]));
        break;
      case "risk_update":
        setResults((prev) => [...prev, event.result]);
        setCompletedAgents((prev) => new Set([...prev, event.result.dimension]));
        setRunningAgents((prev) => {
          const next = new Set(prev);
          next.delete(event.result.dimension);
          return next;
        });
        break;
      case "briefing_token":
        setBriefingStreaming(true);
        setBriefing((prev) => prev + event.text);
        break;
      case "done":
        setBriefingStreaming(false);
        setStatusText("Assessment complete");
        break;
      case "error":
        setError(event.text);
        break;
    }
  };

  // Live assessment against the real backend (free-text box)
  const runLive = async (addr: string, ctx: string) => {
    if (!addr.trim() || loading) return;
    reset();
    setIsSnapshot(false);
    setLoading(true);
    try {
      for await (const event of streamAssessment(addr.trim(), ctx.trim())) {
        processEvent(event);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("fetch") || msg.includes("Failed")) {
        setError("Could not reach the SiteRisk API. Check that NEXT_PUBLIC_SITE_RISK_API points to your deployed backend.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Replay a pre-recorded snapshot (example chips)
  const runExample = async (ex: { slug: string; address: string; context: string }) => {
    if (loading) return;
    setAddress(ex.address);
    setContext(ex.context);
    reset();
    setIsSnapshot(true);
    setLoading(true);
    try {
      const gen = replaySnapshot(ex.slug);
      let res = await gen.next();
      while (!res.done) {
        processEvent(res.value);
        res = await gen.next();
      }
      if (res.value) setNdviDate(res.value); // capturedAt → pin NDVI to event time
    } catch {
      setError("Could not load the recorded demo. The snapshot file may be missing.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runLive(address, context);
  };

  const riskResults = results.filter((r) => r.dimension !== "history");
  const historyResult = results.find((r) => r.dimension === "history");
  const fireResult = results.find((r) => r.dimension === "wildfire");
  const hasResults = results.length > 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-tight text-slate-900">SiteRisk</span>
          <span className="w-px h-3.5 bg-slate-200 shrink-0" />
          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Environmental risk intelligence</span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2.5 flex-1">
        {/* Input form */}
        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 min-w-0"
              placeholder="Enter a US address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-bold text-white uppercase tracking-wide shrink-0 disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              {loading ? "..." : "Assess"}
            </button>
          </div>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-500 placeholder:text-slate-400 focus:outline-none focus:border-indigo-300"
            placeholder="Optional context — buying a home, planning a hike..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={loading}
          />
        </form>

        {/* Example chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.address}
              onClick={() => runExample(ex)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[9px] text-red-700 leading-relaxed">
            {error}
          </div>
        )}

        {/* Agent status */}
        {(loading || selectedAgents.length > 0) && (
          <div className="rounded-lg bg-white border border-slate-200 p-2.5">
            <div className="flex items-center justify-between mb-2">
              {statusText && (
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{statusText}</p>
              )}
              <span className={`text-[7.5px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                isSnapshot ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
              }`}>
                {isSnapshot ? "Recorded" : "Live"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedAgents.map((dim) => {
                const isDone = completedAgents.has(dim);
                const isRunning = runningAgents.has(dim);
                return (
                  <div
                    key={dim}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-semibold transition-all ${
                      isDone
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : isRunning
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isDone ? "bg-emerald-500" : isRunning ? "bg-indigo-500 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                    {AGENT_LABELS[dim] ?? dim}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Map */}
        {location && (
          <div className="rounded-lg overflow-hidden border border-slate-200 shrink-0" style={{ height: 240 }}>
            <SiteRiskMap
              lat={location.lat}
              lng={location.lng}
              threatVector={fireResult?.threat_vector}
              fireGeoJSON={fireResult?.geojson}
              fireResultArrived={!!fireResult}
              ndviDate={ndviDate ?? undefined}
            />
          </div>
        )}

        {/* Risk cards — 2-column grid */}
        {riskResults.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {riskResults.map((r) => (
              <RiskCardView key={r.dimension} result={r} />
            ))}
          </div>
        )}

        {/* History card — full width */}
        {historyResult && <HistoryCardView result={historyResult} />}

        {/* Briefing */}
        {(briefing || briefingStreaming) && (
          <div className="rounded-lg bg-white border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Assessment</span>
            </div>
            <div className="px-3 py-2 max-h-28 overflow-y-auto">
              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                {briefing}
                {briefingStreaming && (
                  <span className="inline-block w-px h-3 bg-indigo-500 ml-0.5 animate-pulse align-text-bottom" />
                )}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasResults && !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
            <p className="text-xs font-semibold text-slate-500">Enter a US address above</p>
            <p className="text-[9px] text-slate-400 leading-relaxed max-w-[240px]">
              Wildfire · Flood · Air Quality · Weather · Disaster History
            </p>
            <p className="text-[9px] text-slate-400 italic mt-1 max-w-[240px]">
              Type any US address for a live assessment, or tap an example above for a recorded one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
