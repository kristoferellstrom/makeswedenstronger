import { cache } from "react";
import { XMLParser } from "fast-xml-parser";

import { siteConfig } from "@/config/site";
import { getNormalizedSearchTokens, normalizeSearchText, normalizeTitle } from "@/lib/text";

type YouTubeEntry = {
  title?: string;
  published?: string;
  link?: { href?: string } | { href?: string }[];
  "yt:videoId"?: string;
  "media:group"?: {
    "media:thumbnail"?: { url?: string } | { url?: string }[];
  };
};

type YouTubeFeed = {
  feed?: {
    entry?: YouTubeEntry | YouTubeEntry[];
  };
};

type YouTubeApiItem = {
  snippet?: {
    title?: string;
    publishedAt?: string;
    resourceId?: {
      videoId?: string;
    };
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YouTubeApiResponse = {
  items?: YouTubeApiItem[];
  nextPageToken?: string;
};

export type YouTubeVideo = {
  id: string;
  title: string;
  url: string;
  embedUrl: string;
  publishedAt: string | null;
  thumbnailUrl?: string;
};

export function buildYouTubeSearchUrl(title: string) {
  const query = encodeURIComponent(title);
  return `https://www.youtube.com/results?search_query=${query}`;
}

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

function resolveFirstHref(links: YouTubeEntry["link"]): string {
  const entries = asArray(links);
  return entries.find((entry) => entry.href)?.href ?? "";
}

function resolveThumbnail(entry: YouTubeEntry): string | undefined {
  const group = entry["media:group"];
  const thumbnails = asArray(group?.["media:thumbnail"]);

  return thumbnails.find((thumb) => thumb.url)?.url;
}

type YouTubeVideoIndex = {
  byTitle: Map<string, YouTubeVideo>;
  entries: Array<YouTubeVideo & { normalizedTitle: string; tokens: string[] }>;
};

const MATCH_STOPWORDS = new Set([
  "och",
  "om",
  "med",
  "for",
  "för",
  "av",
  "i",
  "att",
  "den",
  "det",
  "en",
  "ett",
  "som",
  "ar",
  "är",
  "har",
  "till",
  "pa",
  "på",
  "mot",
  "samt",
  "vd",
  "ceo",
  "grundare",
  "medgrundare",
  "delagare",
  "delägare",
  "gast",
  "gäst",
]);

function filterMatchTokens(tokens: string[]) {
  return tokens.filter((token) => token.length > 2 && !MATCH_STOPWORDS.has(token));
}

function extractGuestTokens(title: string) {
  const [left] = title.split(" - ");
  if (!left) {
    return [];
  }
  const normalizedLeft = normalizeSearchText(left);
  return filterMatchTokens(getNormalizedSearchTokens(normalizedLeft));
}

const getYouTubeVideoIndex = cache(async (): Promise<YouTubeVideoIndex> => {
  const byTitle = new Map<string, YouTubeVideo>();
  const indexedEntries: YouTubeVideoIndex["entries"] = [];

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey && siteConfig.youtubePlaylistId) {
    try {
      let pageToken: string | undefined;
      const items: YouTubeApiItem[] = [];

      do {
        const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("maxResults", "50");
        url.searchParams.set("playlistId", siteConfig.youtubePlaylistId);
        url.searchParams.set("key", apiKey);
        if (pageToken) {
          url.searchParams.set("pageToken", pageToken);
        }

        const response = await fetch(url.toString(), {
          next: { revalidate: siteConfig.revalidateSeconds },
        });

        if (!response.ok) {
          break;
        }

        const data = (await response.json()) as YouTubeApiResponse;
        if (data.items?.length) {
          items.push(...data.items);
        }
        pageToken = data.nextPageToken;
      } while (pageToken);

      for (const item of items) {
        const snippet = item.snippet;
        const title = snippet?.title?.trim() ?? "";
        const normalizedTitle = normalizeTitle(title);

        if (!normalizedTitle) {
          continue;
        }

        const id = snippet?.resourceId?.videoId?.trim() ?? "";
        if (!id) {
          continue;
        }

        const video: YouTubeVideo = {
          id,
          title,
          url: `https://www.youtube.com/watch?v=${id}`,
          embedUrl: `https://www.youtube.com/embed/${id}`,
          publishedAt: snippet?.publishedAt ?? null,
          thumbnailUrl:
            snippet?.thumbnails?.high?.url ??
            snippet?.thumbnails?.medium?.url ??
            snippet?.thumbnails?.default?.url,
        };

        byTitle.set(normalizedTitle, video);
        indexedEntries.push({
          ...video,
          normalizedTitle,
          tokens: getNormalizedSearchTokens(normalizeSearchText(title)),
        });
      }

      return { byTitle, entries: indexedEntries };
    } catch {
      return { byTitle, entries: indexedEntries };
    }
  }

  if (!siteConfig.youtubeFeedUrl) {
    return { byTitle, entries: indexedEntries };
  }

  try {
    const response = await fetch(siteConfig.youtubeFeedUrl, {
      next: { revalidate: siteConfig.revalidateSeconds },
    });

    if (!response.ok) {
      return { byTitle, entries: indexedEntries };
    }

    const xml = await response.text();
    const parsed = parser.parse(xml) as YouTubeFeed;
    const feedEntries = asArray(parsed.feed?.entry);

    for (const entry of feedEntries) {
      const title = entry.title?.trim() ?? "";
      const normalizedTitle = normalizeTitle(title);

      if (!normalizedTitle) {
        continue;
      }

      const id = entry["yt:videoId"]?.trim() ?? "";
      const url = resolveFirstHref(entry.link);

      if (!id || !url) {
        continue;
      }

      const video: YouTubeVideo = {
        id,
        title,
        url,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        publishedAt: entry.published?.trim() ?? null,
        thumbnailUrl: resolveThumbnail(entry),
      };

      byTitle.set(normalizedTitle, video);
      indexedEntries.push({
        ...video,
        normalizedTitle,
        tokens: getNormalizedSearchTokens(normalizeSearchText(title)),
      });
    }
  } catch {
    return { byTitle, entries: indexedEntries };
  }

  return { byTitle, entries: indexedEntries };
});

export async function getYouTubeVideoForTitle(title: string): Promise<YouTubeVideo | null> {
  const index = await getYouTubeVideoIndex();
  const normalizedTitle = normalizeTitle(title);

  if (!normalizedTitle) {
    return null;
  }

  const exact = index.byTitle.get(normalizedTitle);
  if (exact) {
    return exact;
  }

  const normalizedInput = normalizeSearchText(title);
  const inputTokens = getNormalizedSearchTokens(normalizedInput);
  const filteredInputTokens = filterMatchTokens(inputTokens);
  const guestTokens = extractGuestTokens(title);

  if (!inputTokens.length) {
    return null;
  }

  const directMatch = index.entries.filter(
    (entry) =>
      entry.normalizedTitle.includes(normalizedTitle) ||
      normalizedTitle.includes(entry.normalizedTitle),
  );

  if (directMatch.length === 1) {
    return directMatch[0];
  }

  const baseTokens = filteredInputTokens.length ? filteredInputTokens : inputTokens;
  const scored = index.entries
    .map((entry) => {
      const entryFilteredTokens = filterMatchTokens(entry.tokens);
      const entryTokens = entryFilteredTokens.length ? entryFilteredTokens : entry.tokens;
      const overlap = entryTokens.filter((token) => baseTokens.includes(token)).length;
      const guestOverlap = guestTokens.filter((token) => entryTokens.includes(token)).length;
      const score = overlap / Math.max(2, baseTokens.length);
      return { entry, score, overlap, guestOverlap };
    })
    .filter((item) => {
      if (guestTokens.length >= 2 && item.guestOverlap < guestTokens.length) {
        return false;
      }
      return item.score >= 0.5 && item.overlap >= Math.min(2, baseTokens.length);
    })
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return null;
  }

  const [best, second] = scored;
  if (second && best.score - second.score < 0.1) {
    return null;
  }

  return best.entry;
}
