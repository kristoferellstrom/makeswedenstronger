import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getEpisodes } from "@/lib/episodes";
import { getSemanticEntityEntries, getSemanticTopicEntries } from "@/lib/semantic";

function getLatestEpisodeDate(
  entries: Array<{
    publishedAt?: string;
  }>,
) {
  return entries[0]?.publishedAt ? new Date(entries[0].publishedAt) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, topics, entities] = await Promise.all([
    getEpisodes(),
    getSemanticTopicEntries(),
    getSemanticEntityEntries(),
  ]);
  const latestEpisodeDate = getLatestEpisodeDate(episodes);

  return [
    {
      url: siteConfig.siteUrl,
      lastModified: latestEpisodeDate,
    },
    {
      url: `${siteConfig.siteUrl}/episodes`,
      lastModified: latestEpisodeDate,
    },
    {
      url: `${siteConfig.siteUrl}/amnen`,
      lastModified: latestEpisodeDate,
    },
    {
      url: `${siteConfig.siteUrl}/om-podden`,
    },
    {
      url: `${siteConfig.siteUrl}/om-joel`,
    },
    ...episodes.map((episode) => ({
      url: `${siteConfig.siteUrl}/episodes/${episode.slug}`,
      lastModified: new Date(episode.publishedAt),
    })),
    ...topics.map((topic) => ({
      url: `${siteConfig.siteUrl}/amnen/${topic.slug}`,
      lastModified: getLatestEpisodeDate(topic.episodes) ?? latestEpisodeDate,
    })),
    ...entities.map((entity) => ({
      url: `${siteConfig.siteUrl}/personer/${entity.slug}`,
      lastModified: getLatestEpisodeDate(entity.episodes) ?? latestEpisodeDate,
    })),
  ];
}
