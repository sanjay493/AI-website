import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import type { Article } from "@/lib/content";
import { formatDate, getCategoryBySlug } from "@/lib/content";
import { loadArticleBySlug, loadArticleSlugs } from "@/lib/public-articles";
import { absoluteUrl } from "@/lib/site-config";

function isYoutubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes("youtube.com/") || u.includes("youtu.be/");
}

function articleJsonLdImage(a: Article) {
  if (a.coverImageUrl?.startsWith("https://")) {
    return {
      "@type": "ImageObject",
      url: a.coverImageUrl,
      caption: a.title,
    };
  }
  return {
    "@type": "ImageObject",
    url: absoluteUrl("/opengraph-image"),
    caption: a.title,
  };
}

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return loadArticleSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticleBySlug(slug);
  if (!article) return { title: "Not found" };
  const category = getCategoryBySlug(article.category);
  const path = `/blog/${slug}`;
  const publishedIso = `${article.publishedAt}T12:00:00.000Z`;
  const hero = article.coverImageUrl;
  const ogImages =
    hero && hero.startsWith("https://")
      ? [
          {
            url: hero,
            width: 1280,
            height: 720,
            alt: `${article.title} · AI Signal`,
          },
        ]
      : [
          {
            url: "/opengraph-image",
            width: 1200,
            height: 630,
            alt: `${article.title} · AI Signal`,
          },
        ];

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: path },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      url: path,
      publishedTime: publishedIso,
      modifiedTime: publishedIso,
      siteName: "AI Signal",
      locale: "en_US",
      ...(category?.name ? { section: category.name } : {}),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [
        hero && hero.startsWith("https://")
          ? hero
          : absoluteUrl("/opengraph-image"),
      ],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await loadArticleBySlug(slug);
  if (!article) notFound();

  const category = getCategoryBySlug(article.category);
  const canonical = absoluteUrl(`/blog/${slug}`);
  const publishedIso = `${article.publishedAt}T12:00:00.000Z`;

  const wordCount = article.paragraphs
    .join(" ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const listItems: Record<string, unknown>[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: absoluteUrl("/"),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: absoluteUrl("/blog"),
    },
  ];
  if (category) {
    listItems.push({
      "@type": "ListItem",
      position: 3,
      name: category.name,
      item: absoluteUrl(`/category/${category.slug}`),
    });
    listItems.push({
      "@type": "ListItem",
      position: 4,
      name: article.title,
      item: canonical,
    });
  } else {
    listItems.push({
      "@type": "ListItem",
      position: 3,
      name: article.title,
      item: canonical,
    });
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          datePublished: publishedIso,
          dateModified: publishedIso,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonical,
          },
          author: {
            "@type": "Organization",
            name: "AI Signal",
            url: absoluteUrl("/"),
          },
          publisher: {
            "@type": "Organization",
            name: "AI Signal",
            url: absoluteUrl("/"),
          },
          image: articleJsonLdImage(article),
          ...(category?.name
            ? { articleSection: category.name }
            : {}),
          ...(wordCount > 0 ? { wordCount } : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: listItems,
        }}
      />
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/blog" className="hover:text-violet-600 dark:hover:text-violet-400">
            Blog
          </Link>
          {category ? (
            <>
              <span className="px-2 text-zinc-400">/</span>
              <Link
                href={`/category/${category.slug}`}
                className="hover:text-violet-600 dark:hover:text-violet-400"
              >
                {category.name}
              </Link>
            </>
          ) : null}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {article.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          {article.excerpt}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-500">
          <time dateTime={article.publishedAt}>
            {formatDate(article.publishedAt)}
          </time>
          <span aria-hidden>·</span>
          <span>{article.readingTimeMinutes} min read</span>
        </div>
        {article.coverImageUrl ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <Image
              src={article.coverImageUrl}
              alt=""
              width={1200}
              height={675}
              className="aspect-video w-full object-cover"
              priority
            />
          </div>
        ) : null}
        {article.externalUrl && isYoutubeUrl(article.externalUrl) ? (
          <p className="mt-6">
            <a
              href={article.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
            >
              Watch on YouTube
            </a>
          </p>
        ) : null}
        <div className="mt-10 space-y-6 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
          {article.paragraphs
            .filter(
              (p) =>
                p.trim() !== article.excerpt.trim() &&
                !/^Watch on YouTube:\s*https?:\/\//i.test(p.trim()),
            )
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
        <p className="mt-14">
          <Link
            href="/blog"
            className="text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
          >
            ← Back to blog
          </Link>
        </p>
      </article>
    </>
  );
}
