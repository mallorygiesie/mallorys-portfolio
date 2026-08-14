#!/usr/bin/env node
/**
 * Records live SiteRisk SSE streams to JSON snapshots for the demo.
 *
 * Usage:
 *   SITE_RISK_API=http://localhost:8002 node scripts/record-site-risk.mjs
 *
 * Writes one file per example into public/site-risk-snapshots/<slug>.json.
 * The demo replays these for the example chips so they always look great and
 * never depend on a live backend. Free-text addresses still go live.
 *
 * To re-capture during a notable event (e.g. an active hurricane near a coast),
 * just edit EXAMPLES below and re-run while the event is happening.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "site-risk-snapshots");
const BASE = process.env.SITE_RISK_API ?? "http://localhost:8002";

const EXAMPLES = [
  { slug: "utah-fire",   address: "75 W Main St, Torrey, UT 84775",          context: "want to visit my friends" },
  { slug: "sf-coastal",  address: "1 Market St, San Francisco, CA 94105",     context: "thinking of moving here" },
  { slug: "okc-tornado", address: "201 Robert S Kerr Ave, Oklahoma City, OK 73102", context: "buying a home" },
];

async function record({ slug, address, context }) {
  process.stdout.write(`\n● ${slug}: ${address}\n`);
  const start = Date.now();
  const events = [];

  const resp = await fetch(`${BASE}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, context: context || null }),
  });
  if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

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
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));
        events.push({ t: Date.now() - start, event });
        process.stdout.write(`  ${event.type}${event.result ? ` (${event.result.dimension})` : ""}\n`);
      } catch { /* skip malformed */ }
    }
  }

  const hasError = events.some((e) => e.event.type === "error");
  if (hasError) {
    console.error(`  ✗ stream contained an error — NOT saving ${slug}`);
    return;
  }

  const snapshot = {
    address,
    context,
    capturedAt: new Date().toISOString().slice(0, 10),
    events,
  };
  await writeFile(join(OUT_DIR, `${slug}.json`), JSON.stringify(snapshot, null, 0));
  console.log(`  ✓ saved ${slug}.json (${events.length} events)`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const ex of EXAMPLES) {
  try {
    await record(ex);
  } catch (err) {
    console.error(`  ✗ ${ex.slug} failed:`, err.message);
  }
}
console.log("\nDone.");
