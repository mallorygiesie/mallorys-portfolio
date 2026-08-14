import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Work",
  description: "AI apps, ML models, and personal projects by Mallory Giesie.",
};

const PROJECTS = [
  {
    slug: "site-risk",
    title: "SiteRisk",
    year: "2026",
    description:
      "A multi-agent system that fans out across four government APIs in parallel, interprets the results with domain-expert LLM prompts, and streams a compound environmental risk assessment for any US address in real time. Wildfire, flood, air quality, and severe weather. The orchestrator routes to only the agents relevant to your context.",
    tags: ["Azure OpenAI", "Multi-Agent", "FastAPI", "NASA FIRMS", "FEMA", "EPA AirNow", "NOAA NWS", "Open-Meteo", "CartoDB", "Leaflet"],
    type: "Personal Project",
    status: "In Progress",
  },
  {
    slug: "gift-app",
    title: "What to Get Me For My Birthday",
    year: "2025",
    description:
      "A retrieval-augmented generation system built on top of my personal bookmarks. Syncs Raindrop.io saves, enriches each item with GPT-4o, and serves a hybrid vector+keyword search index so anyone can ask 'would Mallory like this?' and get a grounded answer.",
    tags: ["Azure OpenAI", "Azure AI Search", "RAG", "FastAPI", "React", "DALL-E 3"],
    type: "Personal Project",
    status: "Live",
  },
  {
    slug: "mahjong-stats",
    title: "NMJL Mahjong Stats Dashboard",
    year: "2026",
    description:
      "97 games of National Mah Jongg League data turned into a live stats dashboard. Win rate over time, hand category breakdowns, and nemesis ranking. The analysis layer the platform doesn't give you.",
    tags: ["React", "TypeScript", "Recharts", "Data Viz", "Static Analysis"],
    type: "Personal Project",
    status: "Live",
  },
];

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      {/* Header */}
      <div className="mb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
          Work
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 mb-4">
          Projects & case studies
        </h1>
        <p className="text-lg text-stone-500 max-w-xl leading-relaxed">
          Each project includes a breakdown of the architecture, key technical
          decisions, and what I actually learned building it.
        </p>
      </div>

      {/* Project list */}
      <div className="divide-y divide-stone-200">
        {PROJECTS.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="group grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 py-10 hover:opacity-80 transition-opacity"
          >
            <div className="text-sm text-stone-400 pt-0.5 font-mono">
              {project.year}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-xl font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h2>
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">
                  {project.type}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {project.status}
                </span>
              </div>
              <p className="text-stone-500 leading-relaxed mb-4 max-w-2xl text-sm">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-stone-200 px-2.5 py-0.5 text-xs text-stone-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs font-medium text-indigo-500 group-hover:text-indigo-600">
                Read case study →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
