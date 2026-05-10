import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { categories, getCategoryBySlug } from "@/lib/content";
import { loadArticles } from "@/lib/public-articles";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${category.name} · AI Signal`,
      description: category.description,
      url: `/category/${category.slug}`,
      type: "website",
    },
    twitter: {
      title: `${category.name} · AI Signal`,
      description: category.description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const posts = (await loadArticles({ category: category.slug })).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/" className="hover:text-violet-600 dark:hover:text-violet-400">
          Home
        </Link>
        <span className="px-2 text-zinc-400">/</span>
        <Link href="/blog" className="hover:text-violet-600 dark:hover:text-violet-400">
          Blog
        </Link>
        <span className="px-2 text-zinc-400">/</span>
        <span className="text-zinc-900 dark:text-zinc-50">{category.name}</span>
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {category.name}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
        {category.description}
      </p>

      {posts.length === 0 ? (
        <p className="mt-12 text-zinc-600 dark:text-zinc-400">
          No articles in this category yet. Add one from the{" "}
          <Link href="/admin/articles/new" className="text-violet-600 hover:underline">
            admin composer
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {posts.map((article) => (
            <li key={article.slug}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
