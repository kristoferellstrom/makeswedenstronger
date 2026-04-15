import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getEpisodes } from "@/lib/episodes";
import { getSemanticEntityEntries, getSemanticTopicEntries } from "@/lib/semantic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, topics, entities] = await Promise.all([
    getEpisodes(),
    getSemanticTopicEntries(),
    getSemanticEntityEntries(),
  ]);

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
      url: `${siteConfig.siteUrl}/amnen`,
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
    ...topics.map((topic) => ({
      url: `${siteConfig.siteUrl}/amnen/${topic.slug}`,
      lastModified: new Date(),
    })),
    ...entities.map((entity) => ({
      url: `${siteConfig.siteUrl}/personer/${entity.slug}`,
      lastModified: new Date(),
    })),
  ];
}
