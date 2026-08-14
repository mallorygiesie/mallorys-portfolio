import type { Metadata } from "next";
import Link from "next/link";
import MahjongStatsDemo from "@/components/mahjong/MahjongStatsDemo";

export const metadata: Metadata = {
  title: "NMJL Mahjong Stats Dashboard",
  description:
    "A personal stats tracker for National Mah Jongg League games. 97 games of data turned into a live dashboard of win rates, hand category breakdowns, and opponent analysis.",
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

function StatCard({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-2xl font-semibold tracking-tight text-stone-900 mb-0.5">{value}</p>
      <p className="text-sm text-stone-600 mb-1">{label}</p>
      {note && <p className="text-xs text-stone-400">{note}</p>}
    </div>
  );
}

function Decision({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
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

export default function MahjongStatsCaseStudy() {
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
          Personal Project · 2026
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-3">
          NMJL Mahjong Stats Dashboard
        </h1>
        <p className="text-base text-stone-500 leading-relaxed mb-5 max-w-2xl">
          I play a lot of online National Mah Jongg League games. The platform gives you a raw
          export of your game history (date, outcome, winner, winning hand) and nothing else.
          No win rate. No breakdown by hand category. No sense of which opponents you actually
          struggle against. So I built the analysis layer myself: 97 games turned into a live
          stats dashboard that answers the questions the platform doesn't.
        </p>
        <div className="flex flex-wrap gap-2">
          {["React", "TypeScript", "Recharts", "Static Analysis", "Data Viz"].map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[580px_1fr] gap-12 xl:gap-16 items-start">

        {/* LEFT: Sticky live demo */}
        <div className="lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden">
          <MahjongStatsDemo />
        </div>

        {/* RIGHT: Scrolling write-up */}
        <div className="space-y-14 pb-20">

          {/* Overview */}
          <section>
            <SectionLabel>Overview</SectionLabel>
            <div className="space-y-3 text-stone-600 leading-relaxed text-sm">
              <p>
                NMJL (National Mah Jongg League) is American mahjong played with an annual card
                defining all valid winning hands, organized into categories like Consecutive Run,
                Wind & Dragon, 2-4-6-8, and so on. Each hand has a code like{" "}
                <code className="bg-stone-100 px-1 rounded text-xs font-mono">CR/4b</code> or{" "}
                <code className="bg-stone-100 px-1 rounded text-xs font-mono">WD/3</code>.
              </p>
              <p>
                The platform exports your game log as a table. That's it. I parsed 97 games
                and ran the analysis: win rate over time, which hand categories I win with,
                which categories opponents win with against me, and who my biggest nemeses are.
              </p>
              <p>
                The interesting question the data surfaces: there's a gap between the hands I
                win with and the hands that beat me. That gap suggests I should be defensively
                aware of categories I don't personally play.
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
                What it shows
              </p>
              <ul className="space-y-1.5 text-sm text-stone-600">
                {[
                  "Win rate over time (cumulative, across decided games)",
                  "Your winning hands (which NMJL categories you actually complete)",
                  "What beats you: opponent hand category breakdown",
                  "Nemesis ranking: who wins against you most",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-indigo-400 shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Key findings */}
          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>What the Data Says</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard value="31%" label="Win rate" note="Across 89 decided games" />
              <StatCard value="CurtZ" label="Biggest nemesis" note="Most frequent winner vs you" />
              <StatCard value="CR" label="Most common win hand" note="Consecutive Run, yours and theirs" />
              <StatCard value="8" label="Wall games" note="No winner decided" />
            </div>
            <div className="space-y-3 text-stone-600 leading-relaxed text-sm">
              <p>
                A 31% win rate is roughly expected in a 4-player game where each player has
                an equal shot. The baseline would be 25% if all things were equal. The
                data suggests slight above-average performance, though the bot opponents
                may not reflect the difficulty of live play.
              </p>
              <p>
                Consecutive Run hands dominate both sides of the ledger. They're the most
                common hands I complete <em>and</em> the most common hands that beat me.
                This makes sense: CR hands are popular on the NMJL card because they're
                flexible to build. The defensive insight is that CR hands are the ones to
                watch for.
              </p>
            </div>
          </section>

          {/* Technical decisions */}
          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>Technical Decisions</SectionLabel>
            <div className="space-y-8">
              <Decision
                n={1}
                title="No backend: static data in TypeScript"
                body={
                  <p>
                    The game data is a CSV export that changes only when I manually add new
                    games. There's no case for a database or API here. I encoded the 97 rows
                    directly as a TypeScript array and compute all stats client-side with pure
                    functions. Fast, zero infrastructure, trivially testable.
                  </p>
                }
              />
              <Decision
                n={2}
                title="Cumulative win rate, not rolling average"
                body={
                  <p>
                    A rolling average over N games looks smoother but requires choosing a
                    window size that feels arbitrary and hides early-game learning curves.
                    Cumulative rate is noisier early but stabilizes as sample size grows,
                    which is exactly the signal I wanted to see. The line settling toward
                    a value over time is more meaningful than a smoothed snapshot.
                  </p>
                }
              />
              <Decision
                n={3}
                title="Hand category as the primary grouping unit"
                body={
                  <p>
                    NMJL hands have two levels: category (CR, WD, 2468…) and specific hand
                    (CR/4b). Grouping by specific hand produces too many singletons to be
                    useful with this sample size. Category-level grouping gives enough volume per
                    bucket to see real patterns while still being meaningful. Each category
                    has a distinct strategic character.
                  </p>
                }
              />
              <Decision
                n={4}
                title="Bayesian opponent modeling with Dirichlet-Multinomial"
                body={
                  <>
                    <p>
                      The Opponents tab builds a probabilistic hand tendency profile for each
                      opponent using a Dirichlet-Multinomial model. For each of the 7 hand
                      categories, I compute a posterior distribution given observed wins using
                      a flat Dirichlet prior (α=1 per category). The posterior mean is the
                      best estimate of their true preference; the 90% credible interval quantifies
                      uncertainty given sample size.
                    </p>
                    <p>
                      The key behavior: opponents seen in 15+ games show narrow, confident bars.
                      Opponents seen in 3–4 games show wide, uncertain bars. The model honestly
                      reflects that there isn&apos;t enough data to be sure. The prior also means
                      categories with zero observed wins still get a small positive estimate rather
                      than zero, which is the correct Bayesian behavior.
                    </p>
                  </>
                }
              />
            </div>
          </section>

          {/* What I learned */}
          <section className="border-t border-stone-200 pt-10">
            <SectionLabel>What I Learned</SectionLabel>
            <div className="space-y-6">
              {[
                {
                  title: "The data you have shapes the questions you can ask",
                  body: "Game logs without tile-level detail limit analysis to outcome patterns. I can tell which hands I win with but not which hands I was building toward when I lost. That would require the platform to export hand history, which it doesn't. The next layer of insight requires better data collection at the source.",
                },
                {
                  title: "Knowing what beats you is more actionable than knowing what you win with",
                  body: "Your winning hands tell you what you're good at. Your opponents' winning hands tell you what to defend against. The asymmetry in my data (I win with WD/2468 frequently, but CR beats me more than anything else) is the most directly useful finding for actual play.",
                },
              ].map(({ title, body }) => (
                <div key={title} className="space-y-1">
                  <h4 className="font-semibold text-stone-900 text-sm">{title}</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
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
