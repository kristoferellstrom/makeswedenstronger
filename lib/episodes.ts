import { cache } from "react";

import { getEpisodeMeta } from "@/content/episode-meta";
import { getPodcastFeed } from "@/lib/rss";
import {
  getTranscriptForEpisode,
  getTranscriptIndex,
  getTranscriptMatchForEpisode,
} from "@/lib/transcripts";
import {
  getNormalizedSearchTokens,
  matchesWholeWordQuery,
  normalizeSearchText,
} from "@/lib/text";
import type { Episode, EpisodeListItem } from "@/lib/types";

export const getShow = cache(async () => {
  const { show } = await getPodcastFeed();
  return show;
});

export const getEpisodes = cache(async (): Promise<Episode[]> => {
  const [{ episodes }, transcriptIndex] = await Promise.all([
    getPodcastFeed(),
    getTranscriptIndex(),
  ]);

  return episodes.map((episode) => ({
    ...episode,
    hasTranscript: transcriptIndex.has(episode.titleKey),
  }));
});

export async function getEpisodeBySlug(slug: string): Promise<Episode | null> {
  const episodes = await getEpisodes();
  return episodes.find((episode) => episode.slug === slug) ?? null;
}

export async function getLatestEpisodes(limit = 6): Promise<Episode[]> {
  return (await getEpisodes()).slice(0, limit);
}

export function toEpisodeListItem(episode: Episode): EpisodeListItem {
  return {
    guid: episode.guid,
    slug: episode.slug,
    title: episode.title,
    excerpt: episode.excerpt,
    publishedAt: episode.publishedAt,
    imageUrl: episode.imageUrl,
    duration: episode.duration,
    hasTranscript: episode.hasTranscript,
  };
}

export async function getEpisodeListItems(): Promise<EpisodeListItem[]> {
  return (await getEpisodes()).map(toEpisodeListItem);
}

function normalizeMetaValue(value: string): string {
  return normalizeSearchText(value);
}

function isReplayEpisode(episode: Episode): boolean {
  return /\brepris(?:en)?\b/i.test(episode.title);
}

function getOverlapScore(currentValues: string[], candidateValues: string[], weight: number) {
  const currentSet = new Set(currentValues.map(normalizeMetaValue).filter(Boolean));
  const candidateSet = new Set(candidateValues.map(normalizeMetaValue).filter(Boolean));

  let score = 0;

  for (const value of currentSet) {
    if (candidateSet.has(value)) {
      score += weight;
    }
  }

  return score;
}

export async function getRelatedEpisodes(currentEpisode: Episode, limit = 3): Promise<Episode[]> {
  const episodes = await getEpisodes();
  const currentMeta = getEpisodeMeta(currentEpisode.slug);
  const candidateEpisodes = episodes.filter(
    (episode) => episode.slug !== currentEpisode.slug && !isReplayEpisode(episode),
  );

  if (!currentMeta) {
    return candidateEpisodes.slice(0, limit);
  }

  const scoredEpisodes = candidateEpisodes.map((episode) => {
      const candidateMeta = getEpisodeMeta(episode.slug);

      if (!candidateMeta) {
        return { episode, score: 0 };
      }

      const topicScore = getOverlapScore(currentMeta.topics, candidateMeta.topics, 4);
      const entityScore = getOverlapScore(
        currentMeta.entities ?? [],
        candidateMeta.entities ?? [],
        2,
      );

      return {
        episode,
        score: topicScore + entityScore,
      };
    });

  const relatedEpisodes = scoredEpisodes
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (
        new Date(right.episode.publishedAt).getTime() - new Date(left.episode.publishedAt).getTime()
      );
    })
    .slice(0, limit)
    .map(({ episode }) => episode);

  if (relatedEpisodes.length === limit) {
    return relatedEpisodes;
  }

  const fallbackEpisodes = candidateEpisodes
    .filter((episode) => !relatedEpisodes.some((related) => related.slug === episode.slug))
    .slice(0, limit - relatedEpisodes.length);

  return [...relatedEpisodes, ...fallbackEpisodes];
}

export async function getTranscriptCoverage(): Promise<{
  matchedEpisodes: number;
  totalEpisodes: number;
  transcriptFiles: number;
}> {
  const [episodes, transcriptIndex] = await Promise.all([getEpisodes(), getTranscriptIndex()]);

  return {
    matchedEpisodes: episodes.filter((episode) => episode.hasTranscript).length,
    totalEpisodes: episodes.length,
    transcriptFiles: transcriptIndex.size,
  };
}

export async function hasTranscriptForEpisode(episode: Episode): Promise<boolean> {
  return Boolean(await getTranscriptMatchForEpisode(episode));
}

const getEpisodeSearchIndex = cache(async () => {
  const episodes = await getEpisodes();

  return episodes.map((episode) => ({
    episode,
    normalizedTitle: normalizeSearchText(episode.title),
    normalizedDescription: normalizeSearchText(episode.descriptionText),
    normalizedExcerpt: normalizeSearchText(episode.excerpt),
  }));
});

const getEpisodeTranscriptSearchIndex = cache(async () => {
  const episodes = await getEpisodes();

  return Promise.all(
    episodes
      .filter((episode) => episode.hasTranscript)
      .map(async (episode) => {
        const transcript = await getTranscriptForEpisode(episode);
        const transcriptText = transcript
          ? transcript.cues
              .map((cue) => [cue.speaker, cue.text].filter(Boolean).join(" "))
              .join(" ")
          : "";

        return {
          episode,
          searchText: normalizeSearchText(transcriptText),
        };
      }),
  );
});

export async function searchEpisodes(query: string): Promise<Episode[]> {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return getEpisodes();
  }

  const queryTokens = getNormalizedSearchTokens(normalizedQuery);
  const searchIndex = await getEpisodeSearchIndex();
  const scoredEpisodes = new Map<string, { episode: Episode; score: number }>();

  function setEpisodeScore(episode: Episode, score: number) {
    const current = scoredEpisodes.get(episode.slug);

    if (!current || score > current.score) {
      scoredEpisodes.set(episode.slug, { episode, score });
    }
  }

  for (const { episode, normalizedTitle, normalizedDescription, normalizedExcerpt } of searchIndex) {
    const titleMatches = matchesWholeWordQuery(normalizedTitle, queryTokens);
    const descriptionMatches = matchesWholeWordQuery(normalizedDescription, queryTokens);
    const excerptMatches = matchesWholeWordQuery(normalizedExcerpt, queryTokens);

    if (!titleMatches && !descriptionMatches && !excerptMatches) {
      continue;
    }

    let score = 0;

    if (titleMatches) {
      score += 100;

      if (normalizedTitle.startsWith(normalizedQuery)) {
        score += 25;
      } else if (normalizedTitle.includes(normalizedQuery)) {
        score += 15;
      }
    }

    if (descriptionMatches) {
      score += 35;

      if (normalizedDescription.includes(normalizedQuery)) {
        score += 5;
      }
    }

    if (excerptMatches) {
      score += 25;

      if (normalizedExcerpt.includes(normalizedQuery)) {
        score += 5;
      }
    }

    setEpisodeScore(episode, score);
  }

  if (normalizedQuery.length >= 3) {
    const transcriptSearchIndex = await getEpisodeTranscriptSearchIndex();

    for (const { episode, searchText } of transcriptSearchIndex) {
      if (matchesWholeWordQuery(searchText, queryTokens)) {
        let score = 15;

        if (searchText.includes(normalizedQuery)) {
          score += 5;
        }

        setEpisodeScore(episode, score);
      }
    }
  }

  return Array.from(scoredEpisodes.values())
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (
        new Date(right.episode.publishedAt).getTime() - new Date(left.episode.publishedAt).getTime()
      );
    })
    .map(({ episode }) => episode);
}

export async function searchEpisodeListItems(query: string): Promise<EpisodeListItem[]> {
  return (await searchEpisodes(query)).map(toEpisodeListItem);
}
