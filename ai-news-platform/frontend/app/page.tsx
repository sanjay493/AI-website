import type { Metadata } from "next";
import { CoursePromo } from "@/components/course-promo";
import { JsonLd } from "@/components/seo/json-ld";
import { VideoCard } from "@/components/video-card";
import { loadArticles } from "@/lib/public-articles";
import {
  absoluteUrl,
  getCourseUrl,
  SITE_META_DESCRIPTION,
  SITE_NAME,
  SITE_OG_TITLE,
  SITE_TAGLINE,
} from "@/lib/site-config";
import { selectTrendingVideos } from "@/lib/youtube";

/** Re-render at most every 5 minutes so newly ingested trending videos appear without a redeploy. */
export const revalidate = 300;

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
  const videos = selectTrendingVideos(await loadArticles(), 24);

  const orgUrl = absoluteUrl("/");
  const orgId = `${orgUrl}#organization`;

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
              "@id": `${orgUrl}#website`,
              name: SITE_NAME,
              url: orgUrl,
              description: SITE_META_DESCRIPTION,
              inLanguage: "en",
              publisher: { "@id": orgId },
            },
            {
              "@type": "Course",
              name: "Linux & PowerShell Professional Mastery",
              url: getCourseUrl(),
              isAccessibleForFree: true,
              provider: { "@id": orgId },
            },
          ],
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Trending now</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Trending AI &amp; tech videos on YouTube
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Picked automatically from YouTube&apos;s trending charts and leading AI channels, and
          refreshed throughout the day.
        </p>

        <section aria-label="Trending videos" className="mt-8">
          {videos.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <li key={video.slug}>
                  <VideoCard video={video} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              No trending videos are available right now. Please check back shortly.
            </p>
          )}
        </section>

        <div className="mt-16">
          <CoursePromo />
        </div>
      </main>
    </div>
  );
}
