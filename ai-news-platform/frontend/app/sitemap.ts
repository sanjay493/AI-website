import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-config";

/** The public site is now a single page (trending videos + course link). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getSiteUrl(),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}
