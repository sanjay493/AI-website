export type Category = {
  slug: string;
  name: string;
  description: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readingTimeMinutes: number;
  /** Plain paragraphs for the boilerplate; replace with CMS later */
  paragraphs: string[];
};

export const categories: Category[] = [
  {
    slug: "news",
    name: "News",
    description: "Product launches, benchmarks, regulations, and the stories shaping the AI industry.",
  },
  {
    slug: "articles",
    name: "Articles",
    description: "Opinion pieces, analysis, interviews, and long-form reads.",
  },
  {
    slug: "tutorials",
    name: "Tutorials",
    description: "Step-by-step guides for models, tooling, prompting, and building with AI.",
  },
  {
    slug: "trends",
    name: "Trends",
    description: "What teams are adopting, hype vs signal, and where the ecosystem is headed.",
  },
];

export const articles: Article[] = [
  {
    slug: "frontier-models-weekly-brief",
    title: "Frontier models weekly: efficiency, multimodal, and open weights",
    excerpt:
      "New releases squeezed more capability per token — here is what builders should prioritize this month.",
    category: "news",
    publishedAt: "2026-05-06",
    readingTimeMinutes: 6,
    paragraphs: [
      "This week’s releases doubled down on two themes: multimodal fidelity at smaller sizes, and tooling that connects agents to real workloads without bespoke glue code.",
      "If you are shipping product, the takeaway is pragmatic: latency budgets improved enough that “assistant inside the workflow” UX is viable for interactive tasks.",
      "We will revisit evaluation once workloads shift from demos to audited production environments — governance and traceability remain the bottleneck.",
    ],
  },
  {
    slug: "evaluating-ai-features-without-burning-users",
    title: "Evaluating AI features without burning trust (or latency budgets)",
    excerpt:
      "A simple framework for instrumentation, staged rollouts, and human-visible failure modes.",
    category: "articles",
    publishedAt: "2026-05-04",
    readingTimeMinutes: 9,
    paragraphs: [
      "Most regressions users feel are not “model got dumber”; they are changes in grounding, verbosity, refusal behavior, and tool-selection mistakes.",
      "Treat evaluation as layered: synthetic checks catch obvious drift, curated internal tasks catch regressions relevant to your product, and in-product instrumentation catches what labs never modeled.",
      "Make failure graceful: degrade to deterministic paths, cite uncertainty, and always keep a reversible rollout switch.",
    ],
  },
  {
    slug: "nextjs-ai-stack-boilerplate",
    title: "Tutorial: structuring a readable Next.js + AI stack",
    excerpt:
      "Separate transport, orchestration, and UI state so prototypes do not ossify into tech debt.",
    category: "tutorials",
    publishedAt: "2026-05-02",
    readingTimeMinutes: 12,
    paragraphs: [
      "Start by defining your contract: what enters the assistant, what tools it may call, and what the UI must render for partial results.",
      "Keep streaming boundaries explicit: Next.js owns rendering; server routes own auth and provider calls; clients own optimistic UI.",
      "Add observability early: trace IDs across requests help you correlate “slow page” complaints with downstream provider timeouts.",
    ],
  },
  {
    slug: "agent-framework-fatigue",
    title: "Trend: agent-framework fatigue meets boring orchestration wins",
    excerpt:
      "Teams are simplifying: fewer DSLs, more queues, caches, retries, and clear ownership boundaries.",
    category: "trends",
    publishedAt: "2026-04-28",
    readingTimeMinutes: 7,
    paragraphs: [
      "Heavyweight agent frameworks accelerate demos, then slow teams down when workflows need debugging and compliance-friendly audit trails.",
      "The repeatable pattern emerging is mundane in the best way: durable jobs, idempotent tools, explicit state machines, and human approvals at high-risk steps.",
      "Expect more “orchestration platforms” to compete on reliability rather than prompt magic.",
    ],
  },
  {
    slug: "eu-ai-act-practical-checklist",
    title: "News: a practical EU AI Act checklist for product teams",
    excerpt:
      "What to document now so you are not translating chaos into policy language later.",
    category: "news",
    publishedAt: "2026-04-22",
    readingTimeMinutes: 8,
    paragraphs: [
      "Regulatory language is slow; product velocity is fast — the bridge is documentation that maps features to risk categories and mitigations.",
      "If you run user-facing automation, start with data lineage, model change management, and incident response playbooks.",
      "This is not legal advice; it is an engineering hygiene list to keep your counsel in the loop with fewer surprises.",
    ],
  },
  {
    slug: "prompting-is-not-the-product",
    title: "Article: prompting is not the product",
    excerpt:
      "Why great prompts are necessary but not sufficient — and what to build around them.",
    category: "articles",
    publishedAt: "2026-04-18",
    readingTimeMinutes: 10,
    paragraphs: [
      "Prompts are configuration. Products are feedback loops: capture outcomes, measure quality, and iterate with guardrails.",
      "The durable moat is often domain data, evaluation harnesses, and workflow integration — not a secret system string.",
      "Invest in editors and reviewers: human taste still defines what “good” means in most markets.",
    ],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  return articles.filter((a) => a.category === categorySlug);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
