import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resume — Mallory Giesie",
  description: "AI Solutions Engineer. RAG pipelines, multi-agent systems, and the integrations that make them useful in production.",
};

const EXPERIENCE = [
  {
    title: "AI Solutions Engineer",
    org: "ICF",
    period: "Oct 2025 – Present",
    bullets: [
      "Architected and pitched a multi-agent assistant to a utility client, translating agentic concepts (orchestration, tool-calling, intent-based routing) into a value story that moved the deal toward investment; prototyped on the OpenAI Agents SDK with specialized forecasting, performance, and planning agents.",
      "Led discovery and built the RAG engine behind a federal agency's technical-assistance application: a future-state Azure architecture (hybrid retrieval, semantic reranking) plus an LLM-driven layer that selects and relaxes taxonomy filters to keep answers grounded in the best available sources, shipped with human-in-the-loop quality checks and now in pilot with ~100 users across partner organizations.",
      "Designed and deployed a production planning workflow on the live OpenFEMA API, pairing deterministic processing with coordinated LLM calls and engineering it to degrade gracefully, with retries, timeouts, and a manual fallback when model confidence is low.",
      "Co-lead the firm's Claude pilot end to end, onboarding users, running enablement sessions, and translating Claude Code, MCP, and Agent Skills workflows into practical value to drive adoption across teams.",
    ],
  },
  {
    title: "Technology Specialist",
    org: "ICF",
    period: "Oct 2023 – Oct 2025",
    bullets: [
      "Embedded with an internal business team to run discovery, then built and demoed an agentic tool that ingests raw resumes and generates formatted, RFQ-ready resumes in DOCX; the demo won company-sponsored productization and shipped org-wide (~10,000 employees, ~500 active users), on pace to save ~2,000 manual-editing hours annually.",
      "Deployed an ML scoring model that ranked site suitability from parcel-level land use, traffic, and adoption-trajectory data, integrating multiple geospatial sources into a single decision tool.",
    ],
  },
  {
    title: "Data Manager (Master's Capstone)",
    org: "UC Disaster Resilience Network",
    period: "Dec 2022 – Jun 2023",
    bullets: [
      "Partnered with non-technical researchers to turn a complex ecohydrological modeling pipeline into a self-serve R Shiny tool, gathering their requirements and owning data management and reproducibility standards.",
    ],
  },
];

const SKILLS = [
  {
    category: "Solutions & Delivery",
    items: ["Technical discovery", "Business-process mapping", "Future-state architecture", "Rapid POCs", "Solution demos", "Stakeholder communication"],
  },
  {
    category: "Languages",
    items: ["Python", "R", "JavaScript", "SQL"],
  },
  {
    category: "Agentic AI",
    items: ["RAG pipelines", "Multi-agent orchestration", "Tool-calling", "MCP", "Agent Skills & Hooks", "Prompt engineering", "LangGraph", "Claude Agent SDK", "OpenAI Agents SDK", "CrewAI", "LangChain"],
  },
  {
    category: "Responsible AI & Data",
    items: ["PII minimization", "Scoped data access", "Pre-model data redaction", "Audit logging", "Output grounding & guardrails"],
  },
  {
    category: "Evaluation & MLOps",
    items: ["Curated eval/golden sets", "Human-in-the-loop review", "A/B testing on model outputs", "Prompt and model-version control", "Regression checks for LLM drift"],
  },
  {
    category: "Integration & Cloud",
    items: ["REST APIs", "JSON", "Webhooks", "Vector databases", "Azure (App Service, Container Apps, AI Foundry)", "Docker", "Git/GitHub", "CI/CD"],
  },
  {
    category: "Platforms",
    items: ["Azure", "Databricks", "AWS"],
  },
];

const EDUCATION = [
  {
    degree: "M.S., Environmental Data Science",
    school: "UC Santa Barbara, Bren School",
    detail: "3.9 GPA · June 2023",
    note: "Machine Learning, Geospatial Analysis & Remote Sensing, Databases & Data Management",
  },
  {
    degree: "B.S., Quantitative Environmental Science",
    school: "The American University of Paris",
    detail: "3.8 GPA · Dec 2021 · Magna Cum Laude",
    note: "Minor in Computer Science. Languages & Data Structures, Introduction to Artificial Intelligence.",
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
      {children}
    </h2>
  );
}

export default function ResumePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-16 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Resume
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 mb-2">
            Mallory Giesie
          </h1>
          <p className="text-lg text-stone-500">
            AI Solutions Engineer · Santa Barbara, CA
          </p>
        </div>
        <a
          href="/Mallory_Giesie_Resume.pdf"
          download
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-colors self-start mt-1"
        >
          Download PDF
          <span aria-hidden>↓</span>
        </a>
      </div>

      <div className="space-y-0 divide-y divide-stone-200">
        {/* Summary */}
        <section className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr] py-12 first:pt-0">
          <SectionLabel>Summary</SectionLabel>
          <p className="text-stone-600 leading-relaxed max-w-2xl">
            AI Solutions Engineer who turns business problems into shipped agentic solutions. I run discovery end to end and build production RAG pipelines, multi-agent assistants, and the integrations that connect them to real business systems, then drive the adoption that makes them stick. I make the technical case to non-technical stakeholders, and have carried multiple projects from whiteboard to deployed tools serving hundreds of users in regulated domains.
          </p>
        </section>

        {/* Experience */}
        <section className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr] py-12">
          <SectionLabel>Experience</SectionLabel>
          <div className="space-y-10">
            {EXPERIENCE.map((job) => (
              <div key={job.title + job.org}>
                <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
                  <div>
                    <span className="font-semibold text-stone-900">{job.title}</span>
                    <span className="text-stone-400 mx-2">·</span>
                    <span className="text-stone-600">{job.org}</span>
                  </div>
                  <span className="text-sm font-mono text-stone-400 shrink-0">{job.period}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {job.bullets.map((bullet, i) => (
                    <li key={i} className="flex gap-3 text-sm text-stone-500 leading-relaxed">
                      <span className="text-stone-300 shrink-0 mt-0.5">—</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr] py-12">
          <SectionLabel>Skills</SectionLabel>
          <div className="space-y-5">
            {SKILLS.map((group) => (
              <div key={group.category}>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                  {group.category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr] py-12">
          <SectionLabel>Education</SectionLabel>
          <div className="space-y-6">
            {EDUCATION.map((ed) => (
              <div key={ed.degree}>
                <div className="flex items-baseline justify-between gap-4 flex-wrap mb-0.5">
                  <span className="font-semibold text-stone-900">{ed.degree}</span>
                  <span className="text-sm font-mono text-stone-400 shrink-0">{ed.detail}</span>
                </div>
                <p className="text-stone-600 text-sm mb-1">{ed.school}</p>
                <p className="text-stone-400 text-xs leading-relaxed">{ed.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr] py-12">
          <SectionLabel>Contact</SectionLabel>
          <div className="flex flex-wrap gap-6 text-sm text-stone-500">
            <a href="mailto:mallory.a.giesie@gmail.com" className="hover:text-stone-900 transition-colors">
              mallory.a.giesie@gmail.com
            </a>
            <span>(612) 516-0577</span>
            <Link href="/projects" className="hover:text-stone-900 transition-colors">
              Portfolio →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
