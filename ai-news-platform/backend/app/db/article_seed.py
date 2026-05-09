"""Initial articles when DB is empty (matches former in-memory demos)."""

from __future__ import annotations

from datetime import date

SEED_ROWS: list[dict[str, object]] = [
    {
        "slug": "frontier-models-weekly-brief",
        "title": "Frontier models weekly: efficiency, multimodal, and open weights",
        "excerpt": (
            "New releases squeezed more capability per token — "
            "here is what builders should prioritize this month."
        ),
        "category": "news",
        "published_at": date(2026, 5, 6),
        "reading_time_minutes": 6,
        "body": (
            "This week’s releases doubled down on two themes: multimodal fidelity at "
            "smaller sizes, and tooling that connects agents to real workloads without "
            "bespoke glue code.\n\n"
            "If you are shipping product, the takeaway is pragmatic: latency budgets "
            "improved enough that “assistant inside the workflow” UX is viable for interactive tasks.\n\n"
            "We will revisit evaluation once workloads shift from demos to audited production environments — governance and traceability remain the bottleneck."
        ),
    },
    {
        "slug": "evaluating-ai-features-without-burning-users",
        "title": "Evaluating AI features without burning trust (or latency budgets)",
        "excerpt": (
            "A simple framework for instrumentation, staged rollouts, and "
            "human-visible failure modes."
        ),
        "category": "articles",
        "published_at": date(2026, 5, 4),
        "reading_time_minutes": 9,
        "body": (
            "Most regressions users feel are not “model got dumber”; they are changes "
            "in grounding, verbosity, refusal behavior, and tool-selection mistakes.\n\n"
            "Treat evaluation as layered: synthetic checks catch obvious drift, curated internal tasks catch regressions relevant to your product, and in-product instrumentation catches what labs never modeled.\n\n"
            "Make failure graceful: degrade to deterministic paths, cite uncertainty, and always keep a reversible rollout switch."
        ),
    },
    {
        "slug": "nextjs-ai-stack-boilerplate",
        "title": "Tutorial: structuring a readable Next.js + AI stack",
        "excerpt": (
            "Separate transport, orchestration, and UI state so prototypes do not ossify into tech debt."
        ),
        "category": "tutorials",
        "published_at": date(2026, 5, 2),
        "reading_time_minutes": 12,
        "body": (
            "Start by defining your contract: what enters the assistant, what tools it may call, and what the UI must render for partial results.\n\n"
            "Keep streaming boundaries explicit: Next.js owns rendering; server routes own auth and provider calls; clients own optimistic UI.\n\n"
            "Add observability early: trace IDs across requests help you correlate “slow page” complaints with downstream provider timeouts."
        ),
    },
    {
        "slug": "agent-framework-fatigue",
        "title": "Trend: agent-framework fatigue meets boring orchestration wins",
        "excerpt": (
            "Teams are simplifying: fewer DSLs, more queues, caches, retries, and clear ownership boundaries."
        ),
        "category": "trends",
        "published_at": date(2026, 4, 28),
        "reading_time_minutes": 7,
        "body": (
            "Heavyweight agent frameworks accelerate demos, then slow teams down when workflows need debugging and compliance-friendly audit trails.\n\n"
            "The repeatable pattern emerging is mundane in the best way: durable jobs, idempotent tools, explicit state machines, and human approvals at high-risk steps.\n\n"
            "Expect more “orchestration platforms” to compete on reliability rather than prompt magic."
        ),
    },
    {
        "slug": "eu-ai-act-practical-checklist",
        "title": "News: a practical EU AI Act checklist for product teams",
        "excerpt": (
            "What to document now so you are not translating chaos into policy language later."
        ),
        "category": "news",
        "published_at": date(2026, 4, 22),
        "reading_time_minutes": 8,
        "body": (
            "Regulatory language is slow; product velocity is fast — the bridge is documentation that maps features to risk categories and mitigations.\n\n"
            "If you run user-facing automation, start with data lineage, model change management, and incident response playbooks.\n\n"
            "This is not legal advice; it is an engineering hygiene list to keep your counsel in the loop with fewer surprises."
        ),
    },
    {
        "slug": "prompting-is-not-the-product",
        "title": "Article: prompting is not the product",
        "excerpt": (
            "Why great prompts are necessary but not sufficient — and what to build around them."
        ),
        "category": "articles",
        "published_at": date(2026, 4, 18),
        "reading_time_minutes": 10,
        "body": (
            "Prompts are configuration. Products are feedback loops: capture outcomes, measure quality, and iterate with guardrails.\n\n"
            "The durable moat is often domain data, evaluation harnesses, and workflow integration — not a secret system string.\n\n"
            "Invest in editors and reviewers: human taste still defines what “good” means in most markets."
        ),
    },
]
