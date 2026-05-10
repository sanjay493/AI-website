import type { Metadata } from "next";
import { ArticleCard } from "@/components/article-card";
import { loadArticles } from "@/lib/public-articles";

export const metadata: Metadata = {
  title: "Blog",
  description: "All AI Signal posts: news briefs, articles, tutorials, and trends.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog · AI Signal",
    description:
      "All AI Signal posts: news briefs, articles, tutorials, and trends.",
    url: "/blog",
    type: "website",
  },
  twitter: {
    title: "Blog · AI Signal",
    description:
      "All AI Signal posts: news briefs, articles, tutorials, and trends.",
  },
};

export default async function BlogPage() {
  const sorted = (await loadArticles()).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Blog
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Feed is served from the API when{" "}
        <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          SERVER_API_URL
        </code>{" "}
        or{" "}
        <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-900">
          NEXT_PUBLIC_API_URL
        </code>{" "}
        is set; otherwise bundled demo content is used.
      </p>
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {sorted.map((article) => (
          <li key={article.slug}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
    </main>
  );
}
