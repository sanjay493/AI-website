import Link from "next/link";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/article-card";
import { JsonLd } from "@/components/seo/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { categories } from "@/lib/content";
import { loadArticles } from "@/lib/public-articles";
import {
  absoluteUrl,
  SITE_META_DESCRIPTION,
  SITE_NAME,
  SITE_OG_TITLE,
  SITE_TAGLINE,
} from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: { absolute: SITE_OG_TITLE },
  description: SITE_META_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: SITE_OG_TITLE,
    description: SITE_META_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_OG_TITLE,
    description: SITE_META_DESCRIPTION,
    images: [absoluteUrl("/opengraph-image")],
  },
};

export default async function HomePage() {
  const articles = await loadArticles();
  const featured = [...articles]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 3);

  const orgUrl = absoluteUrl("/");
  const orgId = `${orgUrl}#organization`;
  const siteId = `${orgUrl}#website`;

  return (
    <div className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-950">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": orgId,
              name: SITE_NAME,
              url: orgUrl,
              description: SITE_META_DESCRIPTION,
            },
            {
              "@type": "WebSite",
              "@id": siteId,
              name: SITE_NAME,
              url: orgUrl,
              description: SITE_META_DESCRIPTION,
              inLanguage: "en",
              publisher: { "@id": orgId },
            },
          ],
        }}
      />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
          AI Signal
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          News, tutorials, and trends — without the noise.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Stories load from your FastAPI + Postgres backend when configured; otherwise
          the bundled demo feed is shown.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/blog"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 active:bg-violet-700"
          >
            Browse the blog
          </Link>
          <Link
            href="/category/tutorials"
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Start with tutorials
          </Link>
        </div>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Featured
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
            >
              View all posts
            </Link>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((article) => (
              <li key={article.slug}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 grid gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Categories
            </h2>
            <ul className="mt-6 space-y-4">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-violet-200 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-violet-900/40"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {c.name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {c.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <NewsletterForm />
          </div>
        </section>
      </main>
    </div>
  );
}
