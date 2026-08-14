import Link from "next/link";

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/in/" },
  { label: "Email", href: "mailto:mallorygiesie@icloud.com" },
];

const FEATURED_PROJECTS = [
  {
    slug: "site-risk",
    title: "SiteRisk",
    description:
      "A multi-agent system that fans out across four government APIs in parallel and streams a compound environmental risk assessment for any US address. Wildfire, flood, air quality, weather. The orchestrator routes to only the agents relevant to your context.",
    tags: ["Azure OpenAI", "Multi-Agent", "NASA FIRMS", "FEMA", "EPA AirNow", "NOAA", "FastAPI", "React"],
    status: "In Progress",
  },
  {
    slug: "gift-app",
    title: "What to Get Me for My Birthday",
    description:
      "A RAG system that indexes my personal bookmarks, enriches them with GPT-4o, and answers 'would Mallory like this?' Frivolous premise, real hybrid vector search.",
    tags: ["Azure OpenAI", "Azure AI Search", "RAG", "FastAPI", "React"],
    status: "Live",
  },
  {
    slug: "mahjong-stats",
    title: "NMJL Mahjong Stats Dashboard",
    description:
      "97 games of personal mahjong data analyzed and visualized. Win rate over time, hand category breakdowns, and nemesis ranking. The analysis layer the platform doesn't give you.",
    tags: ["React", "TypeScript", "Recharts", "Data Viz"],
    status: "Live",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-14 sm:pt-24 pb-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-indigo-600 tracking-wide uppercase mb-4">
            AI Solutions Engineer
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-stone-900 leading-[1.1] text-balance mb-6">
            I turn business problems into shipped agentic solutions.
          </h1>
          <p className="text-xl text-stone-500 leading-relaxed mb-10 text-balance">
            From client discovery to production rollout — I build RAG pipelines
            and multi-agent systems, then drive the adoption that makes them stick.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
            >
              View my work
              <span aria-hidden>→</span>
            </Link>
            {SOCIAL_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-stone-200" />

      {/* About */}
      <section id="about" className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[200px_1fr]">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              About
            </h2>
          </div>
          <div className="max-w-xl space-y-4 text-stone-600 leading-relaxed">
            {/* TODO: Replace with your own about text */}
            <p>
              I'm an AI Solutions Engineer who runs discovery, builds the system,
              and stays through rollout. My work spans federal agencies and enterprise
              clients — tools now in production serving hundreds of users in regulated domains.
            </p>
            <p>
              I'm drawn to the gap between "this model is impressive in a demo"
              and "this works reliably in production." The engineering that closes it
              is where I spend most of my time.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-stone-200" />

      {/* Selected Work */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[200px_1fr]">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Selected Work
            </h2>
          </div>
          <div className="space-y-6">
            {FEATURED_PROJECTS.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="group block rounded-2xl border border-stone-200 bg-white p-6 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-base font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors">
                    {project.title}
                  </h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${project.status === "Live" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-stone-500 leading-relaxed mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs font-medium text-indigo-500 group-hover:text-indigo-600">
                  Read case study →
                </p>
              </Link>
            ))}

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs text-stone-400">
          <span>© 2025 Mallory Giesie</span>
          <div className="flex gap-6">
            {SOCIAL_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="hover:text-stone-600 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
