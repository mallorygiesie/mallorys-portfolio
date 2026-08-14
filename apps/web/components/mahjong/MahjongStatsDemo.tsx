"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  categoryLabel,
  computeOpponentModels,
  computeStats,
  games,
  type HandTendency,
  type OpponentProfile,
} from "./data";
import MahjongTile, { type Tile } from "./MahjongTile";

// 2026 hand Q4: 222 | 000 | 222 | 666 (each group same suit)
const HEADER_GROUPS: { tile: Tile; rotate: number }[][] = [
  [
    { tile: { kind: "number", suit: "crak", value: 2 }, rotate: -2 },
    { tile: { kind: "number", suit: "crak", value: 2 }, rotate:  1 },
    { tile: { kind: "number", suit: "crak", value: 2 }, rotate: -1 },
  ],
  [
    { tile: { kind: "dragon", value: "Soap" }, rotate:  2 },
    { tile: { kind: "dragon", value: "Soap" }, rotate: -1 },
    { tile: { kind: "dragon", value: "Soap" }, rotate:  1 },
  ],
  [
    { tile: { kind: "number", suit: "bam",  value: 2 }, rotate: -2 },
    { tile: { kind: "number", suit: "bam",  value: 2 }, rotate:  1 },
    { tile: { kind: "number", suit: "bam",  value: 2 }, rotate: -1 },
  ],
  [
    { tile: { kind: "number", suit: "dot",  value: 6 }, rotate:  2 },
    { tile: { kind: "number", suit: "dot",  value: 6 }, rotate: -1 },
    { tile: { kind: "number", suit: "dot",  value: 6 }, rotate:  1 },
  ],
];

const CATEGORY_TILES: Record<string, Tile[]> = {
  CR:    [{ kind: "number", suit: "bam", value: 3 }, { kind: "number", suit: "crak", value: 4 }, { kind: "number", suit: "dot", value: 5 }],
  WD:    [{ kind: "wind", value: "E" }, { kind: "wind", value: "W" }, { kind: "dragon", value: "R" }, { kind: "dragon", value: "G" }],
  "2468":[{ kind: "number", suit: "bam", value: 2 }, { kind: "number", suit: "bam", value: 4 }, { kind: "number", suit: "bam", value: 6 }, { kind: "number", suit: "bam", value: 8 }],
  "13579":[{ kind: "number", suit: "dot", value: 1 }, { kind: "number", suit: "dot", value: 3 }, { kind: "number", suit: "dot", value: 5 }, { kind: "number", suit: "dot", value: 9 }],
  "369": [{ kind: "number", suit: "crak", value: 3 }, { kind: "number", suit: "crak", value: 6 }, { kind: "number", suit: "crak", value: 9 }],
  ALN:   [{ kind: "number", suit: "bam", value: 3 }, { kind: "number", suit: "crak", value: 3 }, { kind: "number", suit: "dot", value: 3 }],
  "2026":[{ kind: "number", suit: "crak", value: 2 }, { kind: "dragon", value: "Soap" }, { kind: "number", suit: "crak", value: 2 }, { kind: "number", suit: "crak", value: 6 }],
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-2xl font-semibold tracking-tight text-stone-900 mb-0.5">{value}</p>
      <p className="text-sm text-stone-600 mb-1">{label}</p>
      {sub && <p className="text-xs text-stone-400">{sub}</p>}
    </div>
  );
}

// 60% probability = full bar width; no real hand should exceed this in a 7-category distribution
const BAR_SCALE = 0.6;

function TendencyBar({ tendency }: { tendency: HandTendency }) {
  const solidPct = Math.min(tendency.posteriorMean / BAR_SCALE, 1) * 100;
  const fadePct = Math.max(Math.min(tendency.ciHigh / BAR_SCALE, 1) * 100 - solidPct, 0);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-[88px] text-stone-500 shrink-0 truncate text-right">{tendency.label}</span>
      <div className="relative flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-indigo-500"
          style={{ width: `${solidPct}%` }}
        />
        <div
          className="absolute top-0 h-full rounded-full bg-indigo-200"
          style={{ left: `${solidPct}%`, width: `${fadePct}%` }}
        />
      </div>
      <span className="text-stone-400 w-8 text-right tabular-nums shrink-0">
        {Math.round(tendency.posteriorMean * 100)}%
      </span>
    </div>
  );
}

function OpponentCard({ profile }: { profile: OpponentProfile }) {
  const confidence = profile.totalWins >= 10 ? "High" : profile.totalWins >= 5 ? "Medium" : "Low";
  const confidenceColor =
    confidence === "High"
      ? "text-emerald-600"
      : confidence === "Medium"
      ? "text-amber-600"
      : "text-stone-400";

  const trendConfig = {
    worsening: { label: "↑ More frequent lately", color: "text-red-500" },
    stable:    { label: "→ Stable",               color: "text-stone-400" },
    improving: { label: "↓ Less frequent lately", color: "text-emerald-600" },
  }[profile.recentTrend];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-stone-900 text-sm">{profile.name}</p>
          <p className={`text-xs ${confidenceColor}`}>
            {confidence} confidence · {profile.totalWins} games
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-semibold tracking-tight text-stone-900">{profile.totalWins}</p>
          <p className="text-xs text-stone-400">wins vs you</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {profile.handTendencies.slice(0, 4).map((t) => (
          <TendencyBar key={t.category} tendency={t} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <p className="text-xs text-stone-500">
          Watch for:{" "}
          <span className="font-medium text-stone-900">{categoryLabel(profile.primaryThreat)}</span>
        </p>
        <span className={`text-xs font-medium ${trendConfig.color}`}>{trendConfig.label}</span>
      </div>
    </div>
  );
}

export default function MahjongStatsDemo() {
  const stats = useMemo(() => computeStats(games), []);
  const opponentModels = useMemo(() => computeOpponentModels(games), []);
  const [tab, setTab] = useState<"overview" | "opponents">("overview");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-stone-200 px-5 shrink-0">
        {(["overview", "opponents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`mr-5 py-3 text-xs font-semibold uppercase tracking-widest border-b-2 transition-colors ${
              tab === t
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            {t === "overview" ? "Overview" : "Opponents"}
          </button>
        ))}
      </div>

      {/* Tile strip — 2026 Q4 hand: 222 | 000 | 222 | 666 */}
      <div className="flex items-end justify-center gap-3 px-5 py-3 border-b border-stone-100 shrink-0">
        {HEADER_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-end gap-1">
            {group.map(({ tile, rotate }, i) => (
              <MahjongTile key={i} tile={tile} size="md" rotate={rotate} />
            ))}
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {tab === "overview" ? (
          <>
            {/* Category legend */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Hand categories</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(CATEGORY_TILES).map(([code, tiles]) => (
                  <div key={code} className="flex items-center gap-2 rounded-lg bg-stone-50 border border-stone-100 px-2 py-1.5">
                    <span className="text-[10px] font-bold text-stone-500 w-9 shrink-0">{code}</span>
                    <div className="flex gap-0.5">
                      {tiles.slice(0, 4).map((tile, i) => (
                        <MahjongTile key={i} tile={tile} size="sm" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Win rate" value={`${stats.winRate}%`} sub="excl. wall games" />
              <StatCard label="Games played" value={stats.total} />
              <StatCard label="Wins" value={stats.wins} />
              <StatCard label="Wall games" value={stats.walls} />
            </div>

            {/* Win rate over time */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
                Win rate over time
              </p>
              <p className="text-xs text-stone-400 mb-3">Cumulative % across decided games</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={stats.winRateOverTime}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="game" tick={{ fontSize: 10, fill: "#aaa" }} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 10, fill: "#aaa" }}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Win rate"]}
                    contentStyle={{ fontSize: 11, border: "1px solid #e8e8e8", borderRadius: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Your hands vs what beats you */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
                  Your wins
                </p>
                <p className="text-xs text-stone-400 mb-3">By hand category</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={stats.yourHands}
                    layout="vertical"
                    margin={{ top: 0, right: 8, bottom: 0, left: 4 }}
                  >
                    <CartesianGrid stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#555" }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(v) => [v, "wins"]}
                      contentStyle={{ fontSize: 11, border: "1px solid #e8e8e8", borderRadius: 6 }}
                    />
                    <Bar dataKey="count" fill="#1c1917" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
                  What beats you
                </p>
                <p className="text-xs text-stone-400 mb-3">Opponent hand categories</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={stats.opponentHands}
                    layout="vertical"
                    margin={{ top: 0, right: 8, bottom: 0, left: 4 }}
                  >
                    <CartesianGrid stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#555" }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(v) => [v, "losses"]}
                      contentStyle={{ fontSize: 11, border: "1px solid #e8e8e8", borderRadius: 6 }}
                    />
                    <Bar dataKey="count" fill="#d4d0cb" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Nemeses */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
                Nemeses
              </p>
              <p className="text-xs text-stone-400 mb-3">Opponents who beat you most</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={stats.opponents} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#555" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#aaa" }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [v, "wins vs you"]}
                    contentStyle={{ fontSize: 11, border: "1px solid #e8e8e8", borderRadius: 6 }}
                  />
                  <Bar dataKey="count" fill="#1c1917" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
                Opponent Model
              </p>
              <p className="text-xs text-stone-400 mb-4">
                Dirichlet-Multinomial posterior over hand categories. Solid bar = estimated
                probability; shaded extension = 90% credible interval. Wider gap means less data.
              </p>
            </div>
            <div className="space-y-3">
              {opponentModels.map((p) => (
                <OpponentCard key={p.name} profile={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
