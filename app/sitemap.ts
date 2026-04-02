import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getEpisodes } from "@/lib/episodes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const episodes = await getEpisodes();

  return [
    {
      url: siteConfig.siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.siteUrl}/episodes`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.siteUrl}/om-podden`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.siteUrl}/om-joel`,
      lastModified: new Date(),
    },
    ...episodes.map((episode) => ({
      url: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
      lastModified: new Date(episode.publishedAt),
    })),
  ];
}
