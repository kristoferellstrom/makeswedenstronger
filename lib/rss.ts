import { cache } from "react";
import { XMLParser } from "fast-xml-parser";

import { siteConfig } from "@/config/site";
import { buildExcerpt, htmlToParagraphs, normalizeTitle, slugifyTitle, stripHtml } from "@/lib/text";
import type { Episode, PodcastShow } from "@/lib/types";

type FeedItem = {
  title?: string;
  pubDate?: string;
  guid?: string | { "#text"?: string };
  link?: string;
  description?: string;
  enclosure?: {
    url?: string;
  };
  "itunes:image"?: {
    href?: string;
  };
  "itunes:duration"?: string;
};

type FeedChannel = {
  title?: string;
  link?: string;
  description?: string;
  image?: {
    url?: string;
  };
  item?: FeedItem | FeedItem[];
  "itunes:image"?: {
    href?: string;
  };
  pubDate?: string;
};

type ParsedFeed = {
  rss?: {
    channel?: FeedChannel;
  };
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  parseTagValue: false,
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function resolveGuid(guid: FeedItem["guid"]): string {
  if (!guid) {
    return "";
  }

  if (typeof guid === "string") {
    return guid;
  }

  return guid["#text"] ?? "";
}

function normalizeEpisodes(items: FeedItem[], fallbackImageUrl: string): Episode[] {
  const slugCounts = new Map<string, number>();

  const normalized = items
    .map((item) => {
      const title = item.title?.trim() ?? "Untitled episode";
      const descriptionHtml = item.description?.trim() ?? "";
      const descriptionText = stripHtml(descriptionHtml);
      const titleKey = normalizeTitle(title);
      const baseSlug = slugifyTitle(title) || slugifyTitle(resolveGuid(item.guid)) || "episode";
      const usageCount = slugCounts.get(baseSlug) ?? 0;
      slugCounts.set(baseSlug, usageCount + 1);

      return {
        guid: resolveGuid(item.guid) || title,
        slug: usageCount === 0 ? baseSlug : `${baseSlug}-${usageCount + 1}`,
        title,
        descriptionHtml,
        descriptionText,
        descriptionParagraphs: htmlToParagraphs(descriptionHtml),
        excerpt: buildExcerpt(descriptionText),
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        audioUrl: item.enclosure?.url ?? "",
        imageUrl: item["itunes:image"]?.href ?? fallbackImageUrl,
        duration: item["itunes:duration"]?.trim() ?? "",
        rssLink: item.link?.trim() ?? "",
        titleKey,
        hasTranscript: false,
      } satisfies Episode;
    })
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

  return normalized;
}

export const getPodcastFeed = cache(async (): Promise<{
  show: PodcastShow;
  episodes: Episode[];
}> => {
  const response = await fetch(siteConfig.rssFeedUrl, {
    next: {
      revalidate: siteConfig.revalidateSeconds,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load RSS feed: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as ParsedFeed;
  const channel = parsed.rss?.channel;

  if (!channel) {
    throw new Error("Invalid RSS feed: missing channel");
  }

  const showImageUrl = channel["itunes:image"]?.href ?? channel.image?.url ?? siteConfig.defaultImage;
  const episodes = normalizeEpisodes(asArray(channel.item), showImageUrl);

  return {
    show: {
      title: channel.title?.trim() || siteConfig.name,
      description: stripHtml(channel.description?.trim() || siteConfig.description),
      imageUrl: showImageUrl,
      link: channel.link?.trim() || siteConfig.links.gymkompaniet,
      latestPublishedAt: channel.pubDate ? new Date(channel.pubDate).toISOString() : null,
    },
    episodes,
  };
});

