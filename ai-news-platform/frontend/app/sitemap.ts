import type { MetadataRoute } from "next";

import { categories } from "@/lib/content";
import { loadArticleSlugs } from "@/lib/public-articles";
import { getSiteUrl } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  for (const c of categories) {
    entries.push({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  const slugs = await loadArticleSlugs();
  for (const { slug } of slugs) {
    entries.push({
      url: `${base}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  return entries;
}
