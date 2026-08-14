import type { SSEEvent } from "@/types/site-risk";

const BASE = process.env.NEXT_PUBLIC_SITE_RISK_API ?? "http://localhost:8002";

interface Snapshot {
  address: string;
  context: string;
  capturedAt: string;
  events: { t: number; event: SSEEvent }[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Replays a pre-recorded snapshot (public/site-risk-snapshots/<slug>.json) with
 * the original agent-by-agent timing, lightly compressed so it never drags.
 * Used for the example chips so they always look great and never depend on a
 * live backend. Returns the snapshot's capturedAt so the map can pin NDVI.
 */
export async function* replaySnapshot(
  slug: string
): AsyncGenerator<SSEEvent, string | undefined> {
  const resp = await fetch(`/site-risk-snapshots/${slug}.json`);
  if (!resp.ok) throw new Error(`Snapshot not found: ${slug}`);
  const snap: Snapshot = await resp.json();

  let prev = 0;
  for (const { t, event } of snap.events) {
    const gap = t - prev;
    prev = t;
    // Briefing tokens stream fast; structural events stagger but stay snappy.
    const delay = event.type === "briefing_token" ? Math.min(gap, 30) : Math.min(gap, 650);
    if (delay > 0) await sleep(delay);
    yield event;
  }
  return snap.capturedAt;
}

export async function* streamAssessment(
  address: string,
  context?: string
): AsyncGenerator<SSEEvent> {
  const resp = await fetch(`${BASE}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, context: context || null }),
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`Request failed: ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6)) as SSEEvent;
        } catch {
          // malformed chunk — skip
        }
      }
    }
  }
}
